#!/usr/bin/env python3
"""
Google Scholar Publications Sync - Python版本
功能：从Google Scholar自动获取出版物并更新config.json
"""

import json
import re
import requests
from bs4 import BeautifulSoup
import time
import os
import sys
from datetime import datetime
from urllib.parse import urljoin, urlparse
import argparse

# Change to project root directory if running from scripts/
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
if os.path.basename(script_dir) == 'scripts':
    os.chdir(project_root)

# 配置
SCHOLAR_USER_ID = "j71Y2-4AAAAJ"  # 您的Scholar ID
REQUEST_DELAY = 2  # 请求间隔（秒）
MAX_RETRIES = 3

class ScholarSync:
    def __init__(self, user_id=None, config_path="config/config.json"):
        self.user_id = user_id or SCHOLAR_USER_ID
        self.config_path = config_path
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch_scholar_publications(self):
        """从Google Scholar获取出版物列表"""
        print(f"🔍 Fetching publications from Google Scholar...")
        
        url = f"https://scholar.google.com/citations?user={self.user_id}&hl=en&sortby=pubdate"
        print(f"📖 URL: {url}")
        
        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 查找出版物表格
                pub_table = soup.find('table', id='gsc_a_t')
                if not pub_table:
                    print("❌ Could not find publications table")
                    return []
                
                publications = []
                rows = pub_table.find_all('tr', class_='gsc_a_tr')
                
                for row in rows:
                    try:
                        pub = self._parse_publication_row(row)
                        if pub:
                            publications.append(pub)
                    except Exception as e:
                        print(f"⚠️  Error parsing row: {e}")
                        continue
                
                print(f"📚 Found {len(publications)} publications")
                return publications
                
            except requests.RequestException as e:
                print(f"❌ Request failed (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(REQUEST_DELAY * (attempt + 1))
                    continue
                else:
                    return []
        
        return []
    
    def _parse_publication_row(self, row):
        """解析单个出版物行"""
        # 标题和链接
        title_elem = row.find('a', class_='gsc_a_at')
        if not title_elem:
            return None
        
        title = title_elem.get_text().strip()
        link = title_elem.get('href', '')
        if link:
            link = urljoin("https://scholar.google.com", link)
        
        # 作者
        authors_elem = row.find('div', class_='gs_gray')
        authors = []
        if authors_elem:
            authors_text = authors_elem.get_text().strip()
            authors = [a.strip() for a in authors_text.split(',')]
        
        # 会议/期刊
        venue_elems = row.find_all('div', class_='gs_gray')
        venue = ""
        if len(venue_elems) > 1:
            venue = venue_elems[1].get_text().strip()
        
        # 年份
        year_elem = row.find('span', class_='gsc_a_h')
        year = 2024  # 默认年份
        if year_elem:
            year_text = year_elem.get_text().strip()
            if year_text.isdigit():
                year = int(year_text)
        
        # 引用数
        cite_elem = row.find('a', class_='gsc_a_c')
        citations = 0
        if cite_elem:
            cite_text = cite_elem.get_text().strip()
            if cite_text.isdigit():
                citations = int(cite_text)
        
        return {
            'title': title,
            'authors': authors,
            'venue': venue,
            'year': year,
            'citations': citations,
            'link': link
        }
    
    def parse_venue_info(self, venue):
        """解析会议/期刊信息"""
        venue_map = {
            'CVPR': {'type': 'conference', 'fullName': 'CVPR'},
            'ICCV': {'type': 'conference', 'fullName': 'ICCV'},
            'ECCV': {'type': 'conference', 'fullName': 'ECCV'},
            'NeurIPS': {'type': 'conference', 'fullName': 'NeurIPS'},
            'ICML': {'type': 'conference', 'fullName': 'ICML'},
            'ICLR': {'type': 'conference', 'fullName': 'ICLR'},
            'AAAI': {'type': 'conference', 'fullName': 'AAAI'},
            'IJCAI': {'type': 'conference', 'fullName': 'IJCAI'},
            'WACV': {'type': 'conference', 'fullName': 'WACV'},
            '3DV': {'type': 'conference', 'fullName': '3DV'},
            'arXiv': {'type': 'preprint', 'fullName': 'arXiv'}
        }
        
        venue_lower = venue.lower()
        
        # 检查已知会议/期刊
        for key, value in venue_map.items():
            if key.lower() in venue_lower:
                return value
        
        # 默认处理
        if 'arxiv' in venue_lower:
            return {'type': 'preprint', 'fullName': 'arXiv'}
        elif 'journal' in venue_lower:
            return {'type': 'journal', 'fullName': venue}
        else:
            return {'type': 'conference', 'fullName': venue}
    
    def extract_arxiv_info(self, venue):
        """从arXiv信息中提取年份和月份信息"""
        if not venue or 'arxiv' not in venue.lower():
            return None, None
        
        # 匹配格式：arXiv:YYMM.NNNNN, arxiv.org/abs/YYMM.NNNNN, arXiv YYMM.NNNNN
        arxiv_match = re.search(r'arxiv[:\s/]*(?:abs/)?(\d{4})\.', venue.lower())
        if arxiv_match:
            yymm = arxiv_match.group(1)
            year_part = int(yymm[:2])
            month_part = yymm[2:]
            
            # 直接使用arXiv ID中的年份
            # arXiv格式：YYMM.NNNNN，其中YY是年份的后两位，MM是月份
            if year_part >= 7:  # 07-99 表示 2007-2099
                year = 2000 + year_part
            else:  # 00-06 表示 2000-2006
                year = 2000 + year_part
            
            return year, yymm  # 返回完整年份和YYMM
        
        return None, None
    
    def smart_year_detection(self, pub, venue_info):
        """智能年份检测"""
        current_year = datetime.now().year
        
        # 1. 尝试从arXiv信息提取年份
        arxiv_year, arxiv_yymm = self.extract_arxiv_info(pub['venue'])
        
        # 2. 尝试从venue信息中提取年份
        venue_year = None
        if venue_info['fullName']:
            year_match = re.search(r'20\d{2}', venue_info['fullName'])
            if year_match:
                venue_year = int(year_match.group(0))
        
        # 3. Scholar提供的年份
        scholar_year = pub['year']
        
        # 4. 智能选择优先级：arXiv > venue > Scholar
        if arxiv_year and 2000 <= arxiv_year <= current_year + 1:  # 允许未来一年
            print(f"📅 Using arXiv year {arxiv_year} for '{pub['title'][:50]}...'")
            return arxiv_year, arxiv_yymm
        elif venue_year and 2020 <= venue_year <= current_year + 1:
            print(f"📅 Using venue year {venue_year} for '{pub['title'][:50]}...'")
            return venue_year, None
        elif 2020 <= scholar_year <= current_year + 1:
            print(f"📅 Using Scholar year {scholar_year} for '{pub['title'][:50]}...'")
            return scholar_year, None
        else:
            print(f"⚠️  No reliable year found for '{pub['title'][:50]}...', using current year {current_year}")
            return current_year, None
    
    def check_duplicate_across_all_years(self, new_pub, existing_config):
        """跨年份智能重复检测"""
        # 收集所有年份的所有论文
        all_existing_pubs = []
        for year, pubs in existing_config.get('publications', {}).items():
            if isinstance(pubs, list):
                all_existing_pubs.extend(pubs)
        
        for existing in all_existing_pubs:
            # 1. 完全标题匹配
            if existing['title'].lower() == new_pub['title'].lower():
                print(f"🔍 Found exact title match: \"{new_pub['title']}\"")
                return existing
            
            # 2. 标题相似度检测（去除标点符号后比较）
            clean_new = re.sub(r'[^a-z0-9\s]', '', new_pub['title'].lower()).strip()
            clean_existing = re.sub(r'[^a-z0-9\s]', '', existing['title'].lower()).strip()
            if clean_new == clean_existing:
                print(f"🔍 Found similar title: \"{new_pub['title']}\" vs \"{existing['title']}\"")
                return existing
            
            # 3. 核心词匹配（标题长度>20字符时）
            if len(new_pub['title']) > 20 and len(existing['title']) > 20:
                new_words = [w for w in clean_new.split() if len(w) > 3]
                existing_words = [w for w in clean_existing.split() if len(w) > 3]
                common_words = [w for w in new_words if w in existing_words]
                
                # 如果85%以上的重要词汇相同，认为是重复
                if len(common_words) / max(len(new_words), len(existing_words)) > 0.85:
                    print(f"🔍 Found word overlap match: \"{new_pub['title']}\" vs \"{existing['title']}\"")
                    return existing
            
            # 4. 作者+关键词匹配
            new_authors = [a.lower().strip() for a in new_pub['authors']]
            existing_authors = [a.lower().strip() for a in existing.get('authors', [])]
            
            common_authors = []
            for na in new_authors:
                for ea in existing_authors:
                    if len(na) > 2 and len(ea) > 2 and (na in ea or ea in na):
                        common_authors.append(na)
                        break
            
            # 如果有共同作者且标题有重叠词汇，可能是重复
            if len(common_authors) >= 3:  # 至少3个共同作者
                title_overlap = len([w for w in clean_new.split() 
                                   if len(w) > 4 and w in clean_existing])
                
                # 对于survey论文，需要更严格的匹配条件
                is_survey_new = 'survey' in clean_new.lower()
                is_survey_existing = 'survey' in clean_existing.lower()
                
                if is_survey_new and is_survey_existing:
                    # Survey论文需要更高的相似度阈值
                    new_words = clean_new.split()
                    existing_words = clean_existing.split()
                    overlap_ratio = title_overlap / max(len(new_words), len(existing_words))
                    
                    if overlap_ratio >= 0.7:
                        print(f"🔍 Found survey paper match: \"{new_pub['title']}\" vs \"{existing['title']}\" (common authors: {len(common_authors)}, title overlap: {title_overlap}, ratio: {overlap_ratio:.2f})")
                        return existing
                    else:
                        print(f"📝 Survey papers with similar authors but different topics: \"{new_pub['title'][:50]}...\" vs \"{existing['title'][:50]}...\" (overlap ratio: {overlap_ratio:.2f})")
                else:
                    # 非survey论文使用原来的条件
                    if title_overlap >= 5:
                        print(f"🔍 Found author+title match: \"{new_pub['title']}\" vs \"{existing['title']}\" (common authors: {len(common_authors)}, title overlap: {title_overlap})")
                        return existing
        
        return None
    
    def is_venue_user_customized(self, venue):
        """检测venue是否是用户手动设置的格式"""
        if not venue:
            return False
        
        import re
        
        # 1. 包含年份的格式（如 CVPR'22, WACV'25, NeurIPS'25, 3DV'24）
        if re.match(r"^[A-Za-z0-9]+'[0-9]{2}$", venue):
            return True
        
        # 2. 包含完整年份的格式（如 CVPR 2022, WACV 2025）
        if re.match(r"^[A-Za-z]+\s+20[0-9]{2}$", venue):
            return True
        
        # 3. 包含特殊格式的arXiv（如 arXiv'2508）
        if re.match(r"^arXiv'[0-9]{4}$", venue):
            return True
        
        # 4. 包含特殊标识的venue（如 Under Review, Journal等）
        special_venues = ['Under Review', 'Journal', 'Conference']
        if venue in special_venues:
            return True
        
        # 5. 包含特殊字符或格式的venue
        if any(char in venue for char in ['(', ')', '&', 'and']):
            return True
        
        return False

    def update_existing_publication(self, existing, scholar_data, formatted_venue=None):
        """更新已存在的论文信息"""
        updated = False
        
        # 1. 更新引用数相关的featured状态（如果用户没有手动设置）
        should_be_featured = scholar_data['citations'] > 10
        if should_be_featured and not existing.get('featured'):
            existing['featured'] = True
            updated = True
            print(f"  ✨ Marked as featured (citations: {scholar_data['citations']})")
        
        # 2. 更新引用数信息（如果配置中没有citations字段）
        if 'citations' not in existing and scholar_data['citations'] > 0:
            existing['citations'] = scholar_data['citations']
            updated = True
            print(f"  📊 Added citations count: {scholar_data['citations']}")
        
        # 3. 保护用户手动设置的venue信息
        is_user_customized_venue = self.is_venue_user_customized(existing.get('venue', ''))
        if not is_user_customized_venue:
            # 更新venue格式（如果提供了新的格式化venue且当前是简单的arXiv格式）
            if (formatted_venue and 
                existing.get('venue') == 'arXiv' and 
                formatted_venue.startswith("arXiv'") and
                existing.get('auto_sync') is not False):
                existing['venue'] = formatted_venue
                updated = True
                print(f"  📝 Updated venue format: {formatted_venue}")
        else:
            print(f"  🔒 Protected user-customized venue: \"{existing.get('venue')}\"")
        
        return updated
    
    def convert_to_config_format(self, scholar_pubs, existing_config):
        """将Scholar数据转换为config格式"""
        print("🔄 Converting Scholar data to config format...")
        
        publications_by_year = {}
        added_count = 0
        updated_count = 0
        
        for pub in scholar_pubs:
            venue_info = self.parse_venue_info(pub['venue'])
            smart_year, arxiv_yymm = self.smart_year_detection(pub, venue_info)
            year = str(smart_year)
            
            # 根据arXiv信息格式化venue
            if arxiv_yymm and venue_info['type'] == 'preprint':
                formatted_venue = f"arXiv'{arxiv_yymm}"
            else:
                formatted_venue = venue_info['fullName']
            
            # 跨年份智能重复检测
            existing = self.check_duplicate_across_all_years(pub, existing_config)
            
            if not existing:
                # 新论文：添加基础信息
                if year not in publications_by_year:
                    publications_by_year[year] = []
                
                config_pub = {
                    'title': pub['title'],
                    'authors': pub['authors'],
                    'venue': formatted_venue,
                    'venue_type': venue_info['type'],
                    'image': "teaser/preprint.jpg",  # 自动同步的论文统一使用preprint图片
                    'auto_sync': True,  # 标记为自动同步
                    'links': [
                        {
                            'name': 'Paper',
                            'url': pub['link'] if pub['link'] else '#',
                            'icon': 'ai ai-arxiv'
                        }
                    ]
                }
                
                # 如果引用数较高，标记为featured
                if pub['citations'] > 10:
                    config_pub['featured'] = True
                
                publications_by_year[year].append(config_pub)
                print(f"✅ Added new: {pub['title']} ({year}) - venue: {formatted_venue}")
                added_count += 1
            else:
                # 已存在的论文：检查是否允许自动更新
                if existing.get('auto_sync') is False:
                    print(f"🔒 Protected: {existing['title']} (auto_sync disabled)")
                else:
                    was_updated = self.update_existing_publication(existing, pub, formatted_venue)
                    if was_updated:
                        print(f"🔄 Updated: {existing['title']} (citations: {pub['citations']})")
                        updated_count += 1
                    else:
                        print(f"ℹ️  Skipped: {existing['title']} (no updates needed)")
        
        print(f"📊 Summary: {added_count} new, {updated_count} updated")
        return publications_by_year, updated_count > 0
    
    def load_config(self):
        """加载现有配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Config file not found: {self.config_path}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ Config file syntax error: {e}")
            return None
    
    def save_config(self, config_data):
        """保存配置"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False)
            print(f"💾 Config saved to {self.config_path}")
            return True
        except Exception as e:
            print(f"❌ Error saving config: {e}")
            return False
    
    def sync(self, dry_run=False):
        """执行同步"""
        print("🚀 Starting Google Scholar sync...")
        print(f"👤 Scholar ID: {self.user_id}")
        print(f"📄 Config file: {self.config_path}")
        
        # 1. 加载现有配置
        print("\n📖 Loading current config...")
        config_data = self.load_config()
        if not config_data:
            return False
        
        # 2. 获取Scholar数据
        print("\n🔍 Fetching from Google Scholar...")
        scholar_pubs = self.fetch_scholar_publications()
        if not scholar_pubs:
            print("⚠️  No publications found, skipping update")
            return False
        
        # 3. 转换和合并数据
        print("\n🔄 Processing publications...")
        new_pubs, has_updates = self.convert_to_config_format(scholar_pubs, config_data)
        
        # 4. 合并新出版物到现有配置
        changes_made = has_updates  # 如果有更新现有论文，也算作有变化
        for year, pubs in new_pubs.items():
            if year not in config_data['publications']:
                config_data['publications'][year] = []
            
            for new_pub in pubs:
                # 再次检查是否已存在（防止重复添加）
                exists = any(
                    p['title'].lower() == new_pub['title'].lower()
                    for p in config_data['publications'][year]
                )
                if not exists:
                    config_data['publications'][year].append(new_pub)
                    changes_made = True
        
        # 5. 保存配置
        if changes_made:
            if dry_run:
                print("\n🔍 DRY RUN - Changes that would be made:")
                print("  (Config file not modified)")
            else:
                print("\n💾 Saving updated config...")
                if self.save_config(config_data):
                    print("🎉 Scholar sync completed successfully!")
                else:
                    return False
        else:
            print("\nℹ️  No new publications to add.")
        
        return True

def main():
    parser = argparse.ArgumentParser(description='Google Scholar Publications Sync')
    parser.add_argument('--user-id', '-u', default=SCHOLAR_USER_ID,
                       help='Google Scholar user ID')
    parser.add_argument('--config', '-c', default='config/config.json',
                       help='Config file path')
    parser.add_argument('--dry-run', '-d', action='store_true',
                       help='Dry run mode (do not modify files)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    
    args = parser.parse_args()
    
    # 创建同步器
    syncer = ScholarSync(user_id=args.user_id, config_path=args.config)
    
    # 执行同步
    success = syncer.sync(dry_run=args.dry_run)
    
    if success:
        print("\n✅ Sync completed successfully!")
        if not args.dry_run:
            print("📝 Next steps:")
            print("1. Review the changes in config/config.json")
            print("2. Run 'python scripts/build_local.py' to update HTML files")
            print("3. Commit and push changes to GitHub")
        return 0
    else:
        print("\n❌ Sync failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
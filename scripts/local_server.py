#!/usr/bin/env python3
"""
本地网站预览服务器
使用方法：python local_server.py
然后在浏览器中访问 http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# 配置
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，添加一些有用的功能"""
    
    def end_headers(self):
        # 添加CORS头，避免一些跨域问题
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    """启动本地服务器"""
    
    # 确保在项目根目录中
    script_dir = Path(__file__).parent
    project_root = script_dir.parent if script_dir.name == 'scripts' else script_dir
    os.chdir(project_root)
    
    print("=" * 60)
    print("🚀 启动本地网站预览服务器")
    print("=" * 60)
    print(f"📁 服务目录: {project_root}")
    print(f"🌐 服务地址: http://{HOST}:{PORT}")
    print("=" * 60)
    
    # 检查是否有index.html文件
    if not Path('index.html').exists():
        print("❌ 错误: 未找到 index.html 文件")
        print("请确保在网站根目录中运行此脚本")
        sys.exit(1)
    
    try:
        # 创建服务器
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ 服务器启动成功!")
            print(f"📱 在浏览器中访问: http://{HOST}:{PORT}")
            print("🔄 文件更改后刷新浏览器即可看到效果")
            print("⏹️  按 Ctrl+C 停止服务器")
            print("=" * 60)
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("🌐 已自动打开浏览器")
            except Exception as e:
                print(f"⚠️  无法自动打开浏览器: {e}")
            
            print()
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 错误: 端口 {PORT} 已被占用")
            print("请尝试以下解决方案:")
            print(f"1. 使用不同端口: python {sys.argv[0]} --port 8001")
            print(f"2. 终止占用端口的进程")
        else:
            print(f"❌ 服务器启动失败: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
        print("👋 再见!")

if __name__ == "__main__":
    # 支持自定义端口
    if len(sys.argv) > 1 and sys.argv[1] == '--port':
        if len(sys.argv) > 2:
            try:
                PORT = int(sys.argv[2])
            except ValueError:
                print("❌ 错误: 端口号必须是数字")
                sys.exit(1)
    
    main() 
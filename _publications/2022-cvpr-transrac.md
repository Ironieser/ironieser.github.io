---
title: "Encoding Multi-scale Temporal Correlation with Transformers for Repetitive Action Counting"
collection: publications
permalink: /publication/2022-cvpr-transrac
excerpt: 'This paper is about repetitive action counting(RAC). Specifically, the previous works focus on performing RAC in short videos,
which is tough for dealing with longer videos in more realistic scenarios, such as interruption during the actions or inconsistent action cycles. '
date: 2022-03-30
venue: 'CVPR Oral'
#paperurl: 'http://ironieser.github.io/files/transrac.pdf'
#citation: 'Your Name, You. (2009). &quot;Paper Title Number 1.&quot; <i>Journal 1</i>. 1(1).'
---
  

## Introduction
[[paper](https://arxiv.org/abs/2204.01018)] [[code](https://github.com/SvipRepetitionCounting/TransRAC)][[dataset](https://svip-lab.github.io/dataset/RepCount_dataset.html)][[Youtube](https://youtu.be/SFpUS9mHHpk)][[Bilibili](https://www.bilibili.com/video/BV1B94y1S7oP?share_source=copy_web)][[Zhihu](https://zhuanlan.zhihu.com/p/543376943?)]

Counting repetitive actions are widely seen in human activities such as physical exercise. Existing methods focus on performing repetitive action counting in short videos, which is tough for dealing with longer videos in more realistic scenarios. In the data-driven era, the degradation of such generalization capability is mainly attributed to the lack of long video datasets. To complement this margin, we introduce a new large-scale repetitive action counting dataset covering a wide variety of video lengths, along with more realistic situations where action interruption or action inconsistencies occur in the video. Besides, we also provide a fine-grained annotation of the action cycles instead of just counting annotation along with a numerical value. Such a dataset contains 1451 videos with about 20000 annotations, which is more challenging. For repetitive action counting towards more realistic scenarios, we further propose **encoding multi-scale temporal correlation with transformers** that can take into account both performance and efficiency. Furthermore, with the help of fine-grained annotation of action cycles, we propose a density map regression-based method to predict the action period, which yields better performance with sufficient interpretability. Our proposed method outperforms state-of-the-art methods on all datasets and also achieves better performance on the un-seen dataset without fine-tuning. 

## RepCount Dataset   
The Homepage of [RepCount Dataset](https://svip-lab.github.io/dataset/RepCount_dataset.html) is available now. 

<table rules="none" align="center">
	<tr>
		<td>
			<center>
				<img src="https://github.com/SvipRepetitionCounting/TransRAC/blob/main/figures/raising.gif" width="100%" />
      </center>
		</td>
		<td>
			<center>
				<img src="https://github.com/SvipRepetitionCounting/TransRAC/blob/main/figures/jump_jack.gif" width="100%" />
      </center>
		</td>
  </tr>
  <tr>
		<td>
			<center>
				<img src="https://github.com/SvipRepetitionCounting/TransRAC/blob/main/figures/squat.gif" width="100%" />
      </center>
		</td>
    <td>
			<center>
				<img src="https://github.com/SvipRepetitionCounting/TransRAC/blob/main/figures/pull_up.gif" width="100%" />
			</center>
		</td>
	</tr>
</table>


## Recommended citation:  
If you find the project or the dataset is useful, please consider citing the paper.  
```
@inproceedings{hu2022transrac,
  title={TransRAC: Encoding Multi-scale Temporal Correlation with Transformers for Repetitive Action Counting},
  author={Hu, Huazhang and Dong, Sixun and Zhao, Yiqun and Lian, Dongze and Li, Zhengxin and Gao, Shenghua},
  booktitle={Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
  pages={19013--19022},
  year={2022}
}
```
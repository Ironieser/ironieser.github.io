---
title: "Tool-LMM: A Large Multi-Modal Model for Tool Agent Learning"
Author: "Chenyu Wang, Weixin Luo, Qianyu Chen, Haonan Mai, Jindi Guo, Xiaohua (Michael) Xuan, Zhengxin Li, Lin Ma, Shenghua Gao"
collection: publications
permalink: /publication/2024-arxiv-toollmm
excerpt: 'This paper is about Tool Agent Learning based on a large multi-modal model. The astonishing performance of large language models (LLMs) in natural language comprehension and generation tasks triggered lots of exploration of using them as central controllers to build agent systems. Multiple studies focus on bridging the LLMs to external tools to extend the application scenarios. To remedy the previous works only accepting single text instructions, in this paper, we introduce a novel system, Tool-LMM, integrating multi-modal encoders with opensource LLMs to synthesize multi-modal information for correct external tool identification. '
date: 2024-06-01
venue: 'Preprint'
#paperurl: 'http://ironieser.github.io/files/roomdesigner.pdf'
#citation: 'Your Name, You. (2009). &quot;Paper Title Number 1.&quot; <i>Journal 1</i>. 1(1).'
---
## Introduction
[[paper](https://arxiv.org/abs/2401.10727)][[code](https://github.com/Tool-LMM/Tool-LMM)]

Recently, the astonishing performance of large language models (LLMs) in natural language comprehension and generation tasks triggered lots of exploration of using them as central controllers to build agent systems. Multiple studies focus on bridging the LLMs to external tools to extend the application scenarios. However, the current LLMs' perceiving tool-use ability is limited to a single text query, which may result in ambiguity in understanding the users' real intentions. LLMs are expected to eliminate that by perceiving the visual- or auditory-grounded instructions' information. Therefore, in this paper, we propose ToolLMM, a system incorporating open-source LLMs and multimodal encoders so that the learned LLMs can be conscious of multi-modal input instruction and then select the function-matched tool correctly. To facilitate the evaluation of the model’s capability, we collect a dataset featured by consisting of multi-modal input tools from HuggingFace. Another important feature of our dataset is that our dataset also contains multiple potential choices for the same instruction due to the existence of identical functions and synonymous functions, which provides more potential solutions for the same query. The experiments reveal that our LMM is capable of recommending appropriate tools for multi-modal instructions.


[//]: # ([Download paper here]&#40;http://academicpages.github.io/files/paper1.pdf&#41;)

[//]: # ([arxiv paper]&#40;https://arxiv.org/abs/2303.12370&#41;   )
Recommended citation: 
```
@article{wang2024toollmm,
  title={Tool-LMM: A Large Multi-Modal Model for Tool Agent Learning},
  author={Wang, Chenyu and Luo, Weixin and Chen, Qianyu and Mai, Haonan and Guo, Jindi and Dong, Sixun and Xuan, Xiaohua (Michael) and Li, Zhengxin and Ma, Lin and Gao, Shenghua},
  journal={arXiv preprint arXiv:2401.10727},
  year={2024}
}
```
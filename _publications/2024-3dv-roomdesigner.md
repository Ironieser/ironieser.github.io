---
title: "RoomDesigner: Encoding Anchor-latents for Style-consistent and Shape-compatible Indoor Scene Generation"
Author: "Yiqun Zhao, Zibo Zhao, Jing Li, Sixun Dong, Shenghua Gao"
collection: publications
permalink: /publication/2024-3dv-roomdesigner
excerpt: 'This paper is about style-consistent and shape-compatible indoor scene generation. Indoor scene generation aims at creating shapecompatible, style-consistent furniture arrangements within
a spatially reasonable layout. However, most existing approaches primarily focus on generating plausible furniture  layouts without incorporating specific details related to individual furniture pieces. To address this limitation we  propose a two-stage model integrating shape priors into the indoor scene generation by encoding furniture as anchor latent representations.'
date: 2024-03-30
venue: '3DV'
#paperurl: 'http://ironieser.github.io/files/roomdesigner.pdf'
#citation: 'Your Name, You. (2009). &quot;Paper Title Number 1.&quot; <i>Journal 1</i>. 1(1).'
---
## Introduction
[[paper](https://arxiv.org/abs/2310.10027)][[code](https://github.com/zhao-yiqun/RoomDesigner)]

Indoor scene generation aims at creating shapecompatible, style-consistent furniture arrangements within
a spatially reasonable layout. However, most existing approaches primarily focus on generating plausible furniture
layouts without incorporating specific details related to individual furniture pieces. To address this limitation, we
propose a two-stage model integrating shape priors into
the indoor scene generation by encoding furniture as anchor latent representations. In the first stage, we employ
discrete vector quantization to encode furniture pieces as
anchor-latents. Based on the anchor-latents representation,
the shape and location information of the furniture was
characterized by a concatenation of location, size, orientation, class, and our anchor latent. In the second stage,
we leverage a transformer model to predict indoor scenes
autoregressively. Thanks to incorporating the proposed
anchor-latents representations, our generative model produces shape-compatible and style-consistent furniture arrangements and synthesis furniture in diverse shapes. Furthermore, our method facilitates various human interaction
applications, such as style-consistent scene completion, object mismatch correction, and controllable object-level editing. Experimental results on the 3D-Front dataset demonstrate that our approach can generate more consistent and
compatible indoor scenes compared to existing methods,
even without shape retrieval. Additionally, extensive ablation studies confirm the effectiveness of our design choices
in the indoor scene generation model.


[//]: # ([Download paper here]&#40;http://academicpages.github.io/files/paper1.pdf&#41;)

[//]: # ([arxiv paper]&#40;https://arxiv.org/abs/2303.12370&#41;   )
Recommended citation: 
```
@inproceedings{roomdesigner2024,
  title={RoomDesigner: Encoding Anchor-latents for Style-consistent and Shape-compatible Indoor Scene Generation},
  author={Yiqun Zhao and Zibo Zhao and Jing Li and Sixun Dong and Shenghua Gao},
  booktitle={Proceedings of the International Conference on 3D Vision (3DV)},
  year={2024}
}
```
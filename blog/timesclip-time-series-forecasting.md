---
title: "Long-term/Short-term Time Series Forecasting: TimesCLIP — CLIP is ALL you NEED"
date: "2025-08-07"
description: "My first PhD work on applying vision-language contrastive learning (CLIP) to time series forecasting. As far as I know, this is the first work to bring multimodal contrastive learning to time series forecasting. The method is extremely simple but surprisingly effective."
tags: ["Time Series", "CLIP", "Multimodal Learning", "Deep Learning", "PhD Research"]
image: "images/blog/timesclip/fig3.png"
---

# Long-term/Short-term Time Series Forecasting: TimesCLIP — CLIP is ALL you NEED

> _Let me take this chance to shamelessly promote my first PhD work — my debut attempt in time series forecasting. I hope folks here can cut me some slack! As far as I know, this is the first work to apply vision-language contrastive learning (à la CLIP) to time series forecasting. The method is extremely simple but surprisingly effective._

---

## TL;DR

**CLIP is ALL you NEED**  
Just replace those painfully hand-tuned transformer layers with **CLIP-TEXT** and you'll set a new SoTA on 16 short-term forecasting datasets.  
Stack our proposed multimodal framework (following CLIP, CoCa[1]) and performance jumps even higher.  
Our hypothesis: **CLIP-Text aligns multimodal space and captures both numerical and visual patterns in time series**.  
_Code coming soon (internship season… overloaded (TдT))_

> **Seriously, CLIP-Text as backbone is OP. Hahaha (TдT)**

- **Paper Title:** _Teaching Time Series to See and Speak: Forecasting with Aligned Visual and Textual Perspectives_  
- **ArXiv:** [PDF](https://arxiv.org/pdf/2506.24124)
- **GitHub:** [Ironieser/TimesCLIP](https://github.com/Ironieser/TimesCLIP) _(GitHub stars welcome, first to release after open source(・ω・) )_

---

## 1. Core Motivation

Existing Transformer-based time series models have **two major flaws**:

### (1) Hyperparameter over-tuning destroys scalability

Many transformer models only perform well with tons of parameter searching — but this ruins scalability and destroys the *very spirit* of Transformer: **no model surgery needed, just stack more layers (ViT-S, ViT-B, ViT-L) and you're good**.

### (2) Single modality limitation

All existing forecasting is based *purely* on numerical input. In reality, professionals (hello stock traders!) rely heavily on **visual patterns (trends)** to predict future changes.

---

**Our corresponding solutions:**

1. **Find a suitable pretrained model as backbone, then don't touch the model structure → `CLIP is ALL you NEED`**
2. **Explore how to apply visual priors to time series forecasting → `Multimodal Contrastive Learning is ALL you NEED`**

<img src="images/blog/timesclip/fig1.png" alt="TimesCLIP Motivation" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 1: Core motivation - existing transformer models suffer from hyperparameter over-tuning and single modality limitations</em>

<img src="images/blog/timesclip/fig2.png" alt="Visual Pattern Recognition" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 2: Comparison of existing methods vs. our multimodal approach - bridging numerical and visual understanding</em>

---

## 2. The Proposed Model: TimesCLIP

Following the motivation above, we try different models (CLIP, BERT, GPT-2, T5) as backbone and apply the multimodal contrastive learning framework to time series forecasting.

### 🧪 **The experimental results are extremely surprising:**

1. **Simply using CLIP-Text as backbone, replacing iTransformer or PatchTST's Encoder (i.e., all those hand-crafted transformer layers), achieves better performance.**

2. **Additionally, we also reference CoCa's framework (from 2022, still ImageNet SoTA in 2025 I think), applying CLIP-style image-text contrastive learning framework to time series forecasting, with extremely significant results.**

But two issues still need to be resolved:

- **Multivariate forecasting:** Dependencies exist between variables, or for univariate prediction, intra-variable dependencies are extremely strong. iTransformer only focuses on inter-variable relations, while PatchTST only focuses on intra-variable relations.
- **How to better convert time series to images?** Numerical line plots? Spectrograms?

<img src="images/blog/timesclip/fig3.png" alt="TimesCLIP Architecture" style="width: 80%; max-width: 800px; height: auto; display: block; margin: 0 auto;">

<em>Figure 3: Our proposed TimesCLIP framework - multimodal contrastive learning for time series forecasting</em>

---

#### **For these, we propose two solutions:**

**1. For intra-variable and inter-variable relations:**  
We believe intra-variable is more important than inter-variable, so the backbone follows PatchTST-style. But inter-variable relations are also needed, so we designed a **Variate Selection** module, introducing learnable variable feature [CLS] tokens, constrained through visual and language contrastive learning, to find relevant variables from inter-variable relations as supplements to guide final generation.

**2. On time series to image conversion:**  
Experience easily shows that existing vision models' training data comes from the internet, obviously unable to handle spectrograms well, while **line plots have abundant training data** (English exam chart description tasks). And LLMs like GPT obviously understand line charts, so we directly convert numerical values to line plots.

Furthermore, since numerical differences between different variables are large, we additionally use **z-score normalization (max-min normalize)** to separately adjust each variable to have reasonable numerical ranges. On the other hand, we use **different colors for each variable**, ensuring variables have the same shape while allowing the vision encoder to distinguish variables from different sources through color.

<img src="images/blog/timesclip/fig4.png" alt="Time Series Visualization" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 4: Visualization of time series to image conversion with different colors for each variable</em>

At this point, our method design is complete.

---

## 3. Important Experimental Results

### 3.1 Short-term Forecasting

Experimental results show: **completely no need to change any model structure or training parameters**, can be widely applied to 22 datasets, especially for short-term forecasting performance which is extremely robust (evaluated on 16 short-term forecasting datasets).

Additionally, our method has significantly better performance than Time-VLM[2] (accepted by ICML 2025). (**Pure CLIP-Text alone already outperforms Time-VLM on M4** (*´∀｀))


![Short-term Forecasting Results](images/blog/timesclip/fig5.png)
*Figure 5: Short-term forecasting results - TimesCLIP achieves SoTA on 16 datasets*

<img src="images/blog/timesclip/fig6.png" alt="Training Configuration" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 6: Training configuration details - EarlyStop and Train Epochs are casually set, LR uses empirical parameters, batch size is limited by GPU memory</em>




### 3.2 Long-term Forecasting

TimesCLIP achieved decent performance on 6 datasets (Exchange, Traffic, Weather, ETTm1, ETTm2, Solar Energy).

> **Note:** We intentionally removed all 96 → 336,720 experimental results. Although we have more obvious performance advantages in such settings, we also follow Dr. Christoph Bergmeir's viewpoint in his NeurIPS 2024 talk [_"Fundamental limitations of foundational forecasting models: The need for multimodality and rigorous evaluation"_](https://cbergmeir.com/talks/neurips2024/) that **such experimental settings are completely meaningless**.
> 
> For example: using 16 hours of data to predict 5 days of weather, using past 4 days of traffic to predict next 30 days, makes absolutely no sense... And the variance and mean are both greater than 0.5... This is prediction after normalization...
> 
> Currently under review, hoping reviewers and ACs can agree with Dr. Christoph Bergmeir's viewpoint and recognize our experiments hahaha (currently not recognized (｡>﹏<｡))
> 
> **Highly recommend Dr. Christoph Bergmeir's talk** - I strongly agree with his points about model issues, dataset problems, and experimental setting concerns in time series forecasting.

![Long-term Forecasting Results](images/blog/timesclip/fig7.png)
*Figure 7: Long-term forecasting performance on 6 datasets* 

### 3.3 Ablation Studies

We conducted experiments with comprehensive permutations to verify:
1. Giving different colors to variables
2. Variate selection module (capturing inter-variable relations)  
3. Multimodal contrastive learning

We also tested all permutations of different vision backbones and language backbones for performance impact. An interesting result is **ViT performs better than CLIP-ViT**. We speculate this is due to large domain differences - the visual model is only used to extract patterns, whether it's pre-aligned with language models may not be that important.

But **CLIP-Text is really useful!** Its feature space might be multimodal, simultaneously having both language and vision characteristics.

Also, pure vision doesn't work, which should be easy to know from experience. But surprisingly, GPT-2 also doesn't work, perhaps aligning to some degree with the viewpoint in [Are Language Models Actually Useful for Time Series Forecasting?](https://arxiv.org/abs/2406.16964). Simple LMs might not work, but T5 performs okay - is it because of parameter count? This work only wants to explore multimodality, so deeper analysis is left for the future.

<img src="images/blog/timesclip/fig8.png" alt="Ablation Study Results" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 8: Ablation study results showing the impact of different components</em>

<img src="images/blog/timesclip/fig9.png" alt="Backbone Comparison" style="width: 60%; max-width: 600px; height: auto; display: block; margin: 0 auto;">

<em>Figure 9: Comparison of different vision and language backbones - CLIP-Text shows superior performance</em>

---

## 4. Final Thoughts

Hope this work can bring some insights to everyone, including:

1. **Multimodality is really useful for time series**
2. **CLIP-Text is really useful**  
3. **Think carefully about the significance of long-term forecasting under TimesNet, iTransformer... be cautious about following... be cautious**

---

## 5. Method Limitations and Future Work

### 5.1 Method Limitations

Of course can't forget to tell everyone about current limitations, roughly three points:

1. **Poor performance on classification**, severe overfitting, perhaps because TimesNet's classification datasets are really too small (some datasets only 120 samples...)

2. **Obviously much slower training speed compared to hand-crafted formers**, could try LoRA

3. **Currently doesn't consider how to handle multivariate and long input**, causes OOM. Future work could explore better tokenizer design, but I completely don't recommend any model modification behavior... If using Transformer, please fix the model structure...

### 5.2 Future Work

1. **Combining with VLMs**: Like LLaVA's vision tower is inherently based on CLIP, integrating this work's framework with VLMs would be very natural. Could also try time series to text, but datasets might be key.

2. **Anomaly Detection**: Time series visual patterns are really perfect for anomaly detection.

---

## References

- **Paper:** [Teaching Time Series to See and Speak: Forecasting with Aligned Visual and Textual Perspectives](https://arxiv.org/pdf/2506.24124)
- **Personal Homepage:** [Sixun Dong - Academic Homepage](https://sixundong.com/)

### References
[1] CoCa: Contrastive Captioners are Image-Text Foundation Models https://arxiv.org/abs/2205.01917  
[2] Time-VLM: Exploring Multimodal Vision-Language Models for Augmented Time Series Forecasting https://arxiv.org/abs/2502.04395

---

## Citation

If you find this work useful, please consider citing:

```bibtex
@article{sixun2025teaching,
  title={Teaching Time Series to See and Speak: Forecasting with Aligned Visual and Textual Perspectives},
  author={Sixun, Dong and Wei, Fan and Wu, Teresa and Yanjie, Fu},
  journal={arXiv preprint arXiv:2506.24124},
  year={2025}
}
```

---

**Finally, welcome any questions, any discussions, and any criticism of this work!** 🚀 
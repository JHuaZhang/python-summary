---
nav:
  title: 首页
  path: /
  order: 0
---

<div class="custom-welcome">
  <div class="content-section">
    <div class="welcome-container">
      <div class="welcome-logo">
        <img src="../public/logo.png" alt="logo" />
      </div>
      <div class="welcome-title">欢迎来到建华python总结1</div>
      <p class="desc">python学习 | 持续更新</p>
      <div class="welcome-buttons">
        <a href="/base/base-01" class="button primary">开始逛逛</a>
        <a href="https://github.com/JHuaZhang/python-summary" target="_blank" class="button outline">GitHub</a>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-welcome {
    width: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .video-banner {
    width: 100%;
    height: 300px;
    overflow: hidden;
    position: relative;
  }

  .banner-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .content-section {
    text-align: center;
    padding: 60px 20px 40px;
    background: #fff;
    color: #333;
  }
  .welcome-container {
    font-weight: 900 !important;
    font-size: 40px !important;
  }
  .welcome-logo img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #e6f7ff;
    object-fit: cover;
  }
  .content-section h1 {
    font-size: 2.5rem;
    margin: 16px 0;
    font-weight: 700;
    color: #1890ff;
  }
  .content-section .desc {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 24px;
  }
  .welcome-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .button {
    display: inline-block;
    padding: 10px 24px;
    font-size: 15px;
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  .button.primary {
    background: #1890ff;
    color: white;
    border: none;
  }
  .button.primary:hover {
    background: #40a9ff;
    transform: translateY(-2px);
  }
  .button.outline {
    background: #fff;
    color: #1890ff;
    border: 1px solid #1890ff;
  }

  .button.outline:hover {
    background: #f5f5f5;
    transform: translateY(-2px);
  }

  .main-section{
    text-align: center;
    font-size:25px;
    font-weight: 900;
  }
  .features-section {
    padding: 0px 20px 50px;
    color: #333;
  }
  .features-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .feature {
    flex: 1 1 240px;
    max-width: 280px;
    border: 1px solid rgb(240, 240, 240);
    padding: 20px;
    text-align: left;
  }
  .feature h3 {
    color: #1890ff;
    margin-bottom: 8px;
    font-size: 1.3rem;
  }
  .feature p {
    color: #666;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  .hrefToPage{
    text-decoration: none;
    color: #1890ff;
  }
  .cardTitle{
    font-size: 20px;
  }
  .list{
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .list-item{
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .content-section h1 {
      font-size: 2rem;
    }
    .video-banner {
      height: 100px;
    }
    .button {
      width: 100%;
      max-width: 260px;
    }
    .features-section,
    .content-section {
      padding: 40px 16px;
    }
  }
</style>

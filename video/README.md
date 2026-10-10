# 开场视频

游戏首次打开时先播放世界观视频；点击“新游戏”后播放序章标题和噩梦视频：

```text
video/start.mp4      游戏最前面的世界观介绍，可按 Tab 跳过
video/baddream.mp4   新游戏序章标题后的莱纳噩梦，结束后直接进入医疗兵对话
```

页面使用原生 HTML5 `<video>`、`playsinline` 和 `object-fit: contain` 播放。不要在这里使用在线视频链接或 iframe。

如果视频文件缺失，开场保持黑屏并显示“跳过”按钮，不会阻止进入序章。

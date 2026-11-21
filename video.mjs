// Native playback remains available without JavaScript; chapter links fall back to MP4 fragments.
const video=document.querySelector('#walkthrough-video');
if(video){
  const links=[...document.querySelectorAll('#video-chapters a')];
  const status=document.querySelector('#video-status');
  let pendingTime=null;
  const seekAndPlay=()=>{
    if(pendingTime===null)return;
    video.currentTime=pendingTime;pendingTime=null;
    video.play().then(()=>{status.textContent='';}).catch(error=>{
      if(error.name!=='AbortError')status.textContent='章节已定位，请点击播放器中的播放按钮。';
    });
  };
  video.addEventListener('loadedmetadata',seekAndPlay);
  for(const link of links)link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();pendingTime=Number(link.dataset.time);
    if(video.readyState>=1)seekAndPlay();else if(video.networkState!==HTMLMediaElement.NETWORK_LOADING)video.load();
  });
  video.addEventListener('timeupdate',()=>{
    const current=links.filter(a=>Number(a.dataset.time)<=video.currentTime+.1).at(-1);
    links.forEach(a=>{if(a===current)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  });
  video.addEventListener('error',()=>{status.textContent='视频暂时无法加载，可使用下方 MP4 链接打开或下载。';});
}

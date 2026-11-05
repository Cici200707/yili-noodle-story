/* Decode ahead of time and retain the decoded Image for scene presentation. */
(()=>{'use strict';
const cache=new Map(),queue=[],queued=new Set();let background=0;
function load(src,priority='high'){
 const found=cache.get(src);if(found){if(priority==='high')found.image.fetchPriority='high';return found.promise}
 const image=new Image();image.decoding='sync';image.fetchPriority=priority;
 const record={image,ready:false,promise:null};cache.set(src,record);
 record.promise=new Promise((resolve,reject)=>{
  let settled=false,decoding=false;
  const timer=setTimeout(()=>fail(new Error('Scene image timed out')),15000);
  function fail(error){if(settled)return;settled=true;clearTimeout(timer);if(cache.get(src)===record)cache.delete(src);reject(error)}
  async function ready(){if(settled||decoding)return;decoding=true;try{if(image.decode)await image.decode();if(settled)return;if(!image.naturalWidth)throw new Error('Empty scene image');settled=true;clearTimeout(timer);record.ready=true;resolve(image)}catch(error){fail(error)}}
  image.onload=ready;image.onerror=()=>fail(new Error('Scene image could not load'));image.src=src;
  if(image.complete&&image.naturalWidth)ready();
 });record.promise.catch(()=>{});return record.promise;
}
function pump(){while(background<2&&queue.length){const src=queue.shift();queued.delete(src);if(cache.get(src)?.ready)continue;background++;load(src,'low').catch(()=>{}).finally(()=>{background--;pump()})}}
function warm(sources){for(const src of sources){if(cache.has(src)||queued.has(src))continue;queued.add(src);queue.push(src)}pump()}
window.SceneImages={load,queue:warm,peek:src=>cache.get(src)?.ready?cache.get(src).image:null};
})();

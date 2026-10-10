const path=require('path'),sharp=require('C:/Users/EBB/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=process.argv[2],dirs=['left','right','down','up'],frames=[];
(async()=>{
 for(let i=0;i<8;i++){
  const cells=[];
  for(let d=0;d<4;d++){
   const file=path.join(root,'images/explore/player/walk-cycle','reiner_walk_'+dirs[d]+'_'+(i+1)+'.png');
   cells.push({input:await sharp(file).resize(124,124,{kernel:'nearest'}).png().toBuffer(),left:d*144+10,top:12});
  }
  frames.push(await sharp({create:{width:576,height:148,channels:4,background:'#232623'}}).composite(cells).raw().toBuffer());
 }
 await sharp(Buffer.concat(frames),{raw:{width:576,height:148*8,channels:4,pageHeight:148}}).gif({delay:Array(8).fill(80),loop:0,dither:0}).toFile(path.join(root,'images/explore/player/walk-cycle/preview.gif'));
})();

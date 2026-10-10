param([string]$SpriteRoot)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Runtime,System.Collections,System.Private.Windows.GdiPlus,System.Private.Windows.Core -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
public static class ReinerRig {
 static Rectangle Bounds(Bitmap b) {
   int l=128,t=128,r=-1,bottom=-1;
   for(int y=0;y<128;y++)for(int x=0;x<128;x++)if(b.GetPixel(x,y).A>0){l=Math.Min(l,x);t=Math.Min(t,y);r=Math.Max(r,x);bottom=Math.Max(bottom,y);}
   if(r<0)throw new Exception("靴子图层为空");
   return Rectangle.FromLTRB(l,t,r+1,bottom+1);
 }
 static int BootTone(Color c) { return (int)Math.Round(.299*c.R+.587*c.G+.114*c.B); }
 static void MatchBootPalette(Bitmap inner,Bitmap outer) {
   // 外侧图层只供取色，保留所有原始像素；内侧的筒、鞋面和鞋底一起匹配。
   var palette=new System.Collections.Generic.List<Color>();
   int[] counts=new int[256];int total=0;
   for(int y=100;y<128;y++)for(int x=0;x<128;x++){
     var reference=outer.GetPixel(x,y);
     if(reference.A>0)palette.Add(reference);
     var pixel=inner.GetPixel(x,y);
     if(pixel.A>0){counts[BootTone(pixel)]++;total++;}
   }
   if(total==0||palette.Count==0)return;
   palette.Sort((a,b)=>BootTone(a).CompareTo(BootTone(b)));
   Color[] mapping=new Color[256];int preceding=0;
   for(int tone=0;tone<256;tone++){
     double rank=(preceding+counts[tone]*.5)/total;
     mapping[tone]=palette[Math.Min(palette.Count-1,(int)(rank*palette.Count))];
     preceding+=counts[tone];
   }
   for(int y=100;y<128;y++)for(int x=0;x<128;x++){
     var pixel=inner.GetPixel(x,y);if(pixel.A==0)continue;
     var reference=mapping[BootTone(pixel)];
     inner.SetPixel(x,y,Color.FromArgb(pixel.A,reference.R,reference.G,reference.B));
   }
 }
 static Bitmap Mask(Bitmap src, Func<int,int,bool> include) {
   var b=new Bitmap(128,128,PixelFormat.Format32bppArgb);
   for(int y=0;y<128;y++)for(int x=0;x<128;x++)if(include(x,y))b.SetPixel(x,y,src.GetPixel(x,y));
   return b;
 }
 static bool Inside(int x,int y,Point[] p) {
   bool inside=false;
   for(int i=0,j=p.Length-1;i<p.Length;j=i++)if((p[i].Y>y)!=(p[j].Y>y)&&x<(p[j].X-p[i].X)*(double)(y-p[i].Y)/(p[j].Y-p[i].Y)+p[i].X)inside=!inside;
   return inside;
 }
 static void DrawBone(Graphics g,Bitmap b,float ox,float oy,float tx,float ty,float angle,float scaleY=1,float scaleX=1) {
   var state=g.Save();g.TranslateTransform(tx,ty);g.RotateTransform(angle);g.ScaleTransform(scaleX,scaleY);g.TranslateTransform(-ox,-oy);
   g.DrawImageUnscaled(b,0,0);g.Restore(state);
 }
 static void Leg(Graphics g,Bitmap upper,Bitmap lower,Bitmap boot,float hipX,float hipY,float kneeY,double phase,bool side,int sign,float bob) {
   if(side) {
     float angle=(float)(Math.Cos(phase)*16*sign);
     float bend=(float)(Math.Max(0,-Math.Sin(phase))*-24*sign);
     double rad=angle*Math.PI/180;
     float kx=hipX-(float)Math.Sin(rad)*(kneeY-hipY);
     float ky=hipY+bob+(float)Math.Cos(rad)*(kneeY-hipY);
     float widthBoost=1f;
     DrawBone(g,upper,hipX,hipY,hipX,hipY+bob,angle,1,widthBoost);
     DrawBone(g,lower,hipX,kneeY,kx,ky,angle+bend,1,widthBoost);
     var shoeCenter=Bounds(boot);
     float shoeX=shoeCenter.X+shoeCenter.Width*.5f,shoeY=shoeCenter.Bottom-1;
     var state=g.Save();
     g.TranslateTransform(kx,ky);g.RotateTransform(angle+bend);g.TranslateTransform(-hipX,-kneeY);
     g.TranslateTransform(shoeX,shoeY);g.ScaleTransform(.78f,.78f);g.TranslateTransform(-shoeX,-shoeY);
     g.DrawImageUnscaled(boot,0,0);g.Restore(state);
   } else {
     float scale=(float)(.91+.09*Math.Cos(phase)*sign);
     float angle=(float)(Math.Sin(phase)*2.5);
     double rad=angle*Math.PI/180;
     float kx=hipX-(float)Math.Sin(rad)*(kneeY-hipY)*scale;
     float ky=hipY+bob+(float)Math.Cos(rad)*(kneeY-hipY)*scale;
     DrawBone(g,upper,hipX,hipY,hipX,hipY+bob,angle,scale);
     DrawBone(g,lower,hipX,kneeY,kx,ky,angle,scale);
     DrawBone(g,boot,hipX,kneeY,kx,ky,angle,scale);
   }
 }
 public static void Build(string root,string dir) {
   using(var src=new Bitmap(Path.Combine(root,"v2","reiner_idle_"+dir+".png"))) {
     bool side=dir=="left"||dir=="right";int split=dir=="left"?63:dir=="right"?65:64;
     bool nearRight=dir=="left"||dir=="down";
     int legY=side?80:81,kneeY=side?100:101;
     int thighL=side?54:51,thighR=side?74:77;
     Func<int,int,bool> leg=(x,y)=>y>=legY && (y>=91 || (x>=thighL&&x<thighR));
     Func<int,int,bool> near=(x,y)=>{
       int edge=split;
       if(side&&y>=110)edge+=(dir=="left"?-1:1)*(int)Math.Min(10,(y-110)*1.5);
       return nearRight?x>=edge:x<edge;
     };
     Point[] arm=side?new[]{new Point(65,39),new Point(71,41),new Point(75,56),new Point(76,70),new Point(71,72),new Point(71,79),new Point(64,80),new Point(62,76),new Point(64,70),new Point(66,64),new Point(65,52),new Point(63,44)}
       :new[]{new Point(76,44),new Point(83,46),new Point(88,64),new Point(87,81),new Point(80,83),new Point(77,76),new Point(77,62),new Point(73,49)};
     if(dir=="right")for(int i=0;i<arm.Length;i++)arm[i]=new Point(128-arm[i].X,arm[i].Y);
     Point[] other=new Point[arm.Length];for(int i=0;i<arm.Length;i++)other[i]=new Point(128-arm[i].X,arm[i].Y);
     Func<int,int,bool> armNear=(x,y)=>!leg(x,y)&&Inside(x,y,arm)&&(!side||y<70||(dir=="left"?x<72:x>56));
     Func<int,int,bool> armFar=(x,y)=>!side&&!leg(x,y)&&Inside(x,y,other);
     using(var body=Mask(src,(x,y)=>!leg(x,y)&&!armNear(x,y)&&!armFar(x,y)))
     using(var upperN=Mask(src,(x,y)=>leg(x,y)&&near(x,y)&&y<kneeY+2))
     using(var lowerN=Mask(src,(x,y)=>leg(x,y)&&near(x,y)&&y>=kneeY&&y<115))
     using(var upperF=Mask(src,(x,y)=>leg(x,y)&&!near(x,y)&&y<kneeY+2))
     using(var lowerF=Mask(src,(x,y)=>leg(x,y)&&!near(x,y)&&y>=kneeY&&y<115))
     using(var bootN=Mask(src,(x,y)=>leg(x,y)&&near(x,y)&&y>=105))
     using(var bootF=Mask(src,(x,y)=>leg(x,y)&&!near(x,y)&&y>=105))
     using(var armN=Mask(src,armNear))using(var armF=Mask(src,armFar)) {
       float nearX=nearRight?(side?67:69):(side?61:59);
       float farX=nearRight?(side?59:59):(side?69:69);
       if(side) {
         // 内侧原图只露出部分靴子，无法靠调色或拉宽补全。
         // 共用外侧完整的小腿和靴子，仅平移到内侧膝关节；动作相位仍独立。
         using(var bootGraphics=Graphics.FromImage(bootF)) {
           bootGraphics.Clear(Color.Transparent);
           bootGraphics.CompositingMode=CompositingMode.SourceCopy;
           bootGraphics.DrawImageUnscaled(bootN,(int)(farX-nearX),0);
         }
       }
       float shoulderX=side?(dir=="left"?69:59):80;
       float shoulderY=side?44:48;
       int sign=dir=="left"?1:dir=="right"?-1:dir=="down"?1:-1;
       var folder=Path.Combine(root,"walk-cycle");Directory.CreateDirectory(folder);
       for(int i=0;i<8;i++)using(var frame=new Bitmap(128,128,PixelFormat.Format32bppArgb)) {
         double phase=i*Math.PI/4;
         float bob=(i==2||i==6)?-1:0;
         using(var g=Graphics.FromImage(frame)) {
           g.Clear(Color.Transparent);g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;g.SmoothingMode=SmoothingMode.None;
           Leg(g,upperF,lowerF,bootF,farX,legY,kneeY,phase+Math.PI,side,sign,bob);
           Leg(g,upperN,lowerN,bootN,nearX,legY,kneeY,phase,side,sign,bob);
           if(!side)DrawBone(g,armF,48,48,48,48+bob,(float)(Math.Cos(phase)*5));
           g.DrawImageUnscaled(body,0,(int)bob);
           DrawBone(g,armN,shoulderX,shoulderY,shoulderX,shoulderY+bob,(float)(-Math.Cos(phase)*(side?10:5)*sign));
         }
         frame.Save(Path.Combine(folder,"reiner_walk_"+dir+"_"+(i+1)+".png"),ImageFormat.Png);
       }
     }
   }
 }
 public static void Contact(string root) {
   using(var b=new Bitmap(1024,512))using(var g=Graphics.FromImage(b)) {
     g.Clear(Color.FromArgb(35,38,35));g.InterpolationMode=InterpolationMode.NearestNeighbor;
     string[] dirs={"left","right","down","up"};
     for(int y=0;y<4;y++)for(int x=0;x<8;x++)using(var f=new Bitmap(Path.Combine(root,"walk-cycle","reiner_walk_"+dirs[y]+"_"+(x+1)+".png")))g.DrawImageUnscaled(f,x*128,y*128);
     b.Save(Path.Combine(root,"walk-cycle","contact-sheet.png"),ImageFormat.Png);
   }
 }
}
'@
'left','right','down','up' | ForEach-Object { [ReinerRig]::Build($SpriteRoot,$_) }
[ReinerRig]::Contact($SpriteRoot)

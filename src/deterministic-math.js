// Browser and Node releases can return different final bits from native trig.
// A shared arithmetic implementation keeps chaotic contact simulations replayable.
const PI=3.141592653589793,TAU=6.283185307179586,HALF_PI=1.5707963267948966;
function reduce(value){return value-TAU*Math.floor((value+PI)/TAU);}
export function simSin(value){
 let x=reduce(value);if(x>HALF_PI)x=PI-x;else if(x<-HALF_PI)x=-PI-x;
 const z=x*x;
 return x*(1+z*(-1/6+z*(1/120+z*(-1/5040+z*(1/362880+z*(-1/39916800+z*(1/6227020800+z*(-1/1307674368000+z*(1/355687428096000-z/121645100408832000)))))))));
}
export function simCos(value){
 let x=reduce(value),sign=1;if(x>HALF_PI){x=PI-x;sign=-1;}else if(x<-HALF_PI){x=-PI-x;sign=-1;}
 const z=x*x;
 return sign*(1+z*(-1/2+z*(1/24+z*(-1/720+z*(1/40320+z*(-1/3628800+z*(1/479001600+z*(-1/87178291200+z*(1/20922789888000+z*(-1/6402373705728000+z/2432902008176640000))))))))));
}
function atanSeries(x){
 const z=x*x;let p=0;
 for(let n=20;n>=0;n--)p=(n%2?-1:1)/(2*n+1)+z*p;
 return x*p;
}
function atanPositive(x){
 if(x>1)return HALF_PI-atanPositive(1/x);
 if(x>.41421356237309503)return PI/4+atanSeries((x-1)/(x+1));
 return atanSeries(x);
}
export function simAtan2(y,x){
 if(Number.isNaN(x)||Number.isNaN(y))return NaN;
 if(x===0){if(y>0)return HALF_PI;if(y<0)return -HALF_PI;return Object.is(x,-0)?Object.is(y,-0)?-PI:PI:y;}
 if(y===0)return x<0?Object.is(y,-0)?-PI:PI:y;
 const angle=atanPositive(Math.abs(y/x));
 return x>0?(y<0?-angle:angle):y<0?angle-PI:PI-angle;
}
// Physical coordinates are bounded; the explicit operation order is identical
// in each runtime, including implementations with different native hypot paths.
export function simHypot(a,b,c=0){return Math.sqrt(a*a+b*b+c*c);}

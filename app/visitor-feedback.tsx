'use client';
import {createElement,useEffect} from 'react';
export default function VisitorFeedback({thread,expanded=false,compact=false,guestbook=false,noLike=false}:{thread:string;expanded?:boolean;compact?:boolean;guestbook?:boolean;noLike?:boolean}){
 useEffect(()=>{if(!document.querySelector('script[data-feedback]')){const script=document.createElement('script');script.type='module';script.src='/visitor-feedback.js?v=20261004-replies';script.dataset.feedback='true';document.head.appendChild(script);}},[]);
 return createElement('visitor-feedback',{thread,...(expanded?{expanded:''}:{}),...(compact?{compact:''}:{}),...(guestbook?{guestbook:''}:{}),...(noLike?{'no-like':''}:{})});
}

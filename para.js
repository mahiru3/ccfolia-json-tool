function normalizeHex(v){
  const s=String(v||"").trim();
  if(/^#[0-9a-fA-F]{6}$/.test(s))return s.toLowerCase();
  if(/^[0-9a-fA-F]{6}$/.test(s))return "#"+s.toLowerCase();
  return "#000000";
}

function updateTextPreviews(){
  const pv1=document.getElementById("pv1");
  pv1.textContent=text1.value;
  pv1.style.fontFamily=font1free.value||font1sel.value;
  pv1.style.fontSize="48px";
  pv1.style.color=color1.value;

  const pv2=document.getElementById("pv2");
  pv2.textContent=text2.value;
  pv2.style.fontFamily=font2free.value||font2sel.value;
  pv2.style.fontSize="36px";
  pv2.style.color=color2.value;
}

let picker=null;
let activeText=null;
let activeBtn=null;

function openColor(title,textId,btnId){
  const panel=colorPanel;
  colorPanelTitle.textContent=title;
  activeText=textId;
  activeBtn=btnId;
  panel.hidden=false;

  if(!picker){
    picker=new iro.ColorPicker("#iroMount",{layout:[
      {component:iro.ui.Wheel},
      {component:iro.ui.Slider,options:{sliderType:"value"}}
    ]});
    picker.on("color:change",c=>{
      const hex=c.hexString;
      document.getElementById(activeText).value=hex;
      document.getElementById(activeBtn).style.background=hex;
      updateTextPreviews();
    });
  }
  picker.color.hexString=document.getElementById(textId).value;
}

function closeColor(){
  colorPanel.hidden=true;
}

colorPanelClose.onclick=closeColor;
colorPanel.onclick=e=>{if(e.target===colorPanel)closeColor();}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeColor();});

color1btn.onclick=()=>openColor("色①","color1","color1btn");
color2btn.onclick=()=>openColor("色②","color2","color2btn");

[color1,color2].forEach((el,i)=>{
  const btn=i?color2btn:color1btn;
  btn.style.background=el.value;
  el.oninput=()=>{
    btn.style.background=normalizeHex(el.value);
    updateTextPreviews();
  };
});

[text1,text2,font1sel,font2sel,font1free,font2free].forEach(el=>{
  el.oninput=updateTextPreviews;
});

updateTextPreviews();

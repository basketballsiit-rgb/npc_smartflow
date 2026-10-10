import{r as R,j as t,H as W,L as q}from"./app-mSdwyeen.js";function B({project:i}){const[A,H]=R.useState("normal"),o=i?.chapter_1_sections||{},P=i?.chapter_1_content||"",h=e=>{if(e==null)return"";const s={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(e).replace(/[๐-๙]/g,a=>s[a]||a)},r=(e,s="")=>{if(e==null)return s;if(typeof e=="string")return e;if(typeof e=="number")return String(e);if(typeof e=="object"){if(Array.isArray(e))return e.map(a=>r(a)).filter(Boolean).join(`
`)||s;if(e.text!==void 0||e.unit!==void 0)return[e.text,e.unit].filter(Boolean).join(" ")||s;if(e.description)return String(e.description);if(e.title)return String(e.title);if(e.name)return String(e.name);try{return JSON.stringify(e)}catch{return s}}return String(e)},L=()=>{window.print()},$={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[A],O=(e="รายงานผลโครงการ_บทที่_1")=>{const s=document.querySelector(".print-doc-container");if(!s)return;const a=s.cloneNode(!0);a.querySelectorAll(".no-print").forEach(c=>c.remove()),a.querySelectorAll(".academic-subheading").forEach(c=>{c.setAttribute("align","left"),c.style.textAlign="left",c.style.textJustify="none"});const N=(e||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),_=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${N}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page Section1 {
                        size: 21.0cm 29.7cm;
                        margin: 2.54cm 2.54cm 2.54cm 2.54cm;
                        mso-header-margin: 1.27cm;
                        mso-footer-margin: 1.27cm;
                        mso-paper-source: 0;
                    }
                    div.Section1 { page: Section1; }
                    body {
                        font-family: 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', 'Cordia New', sans-serif;
                        font-size: 16pt;
                        line-height: 1.65;
                        color: #000000;
                    }
                    h1 {
                        font-size: 20pt;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 8pt;
                    }
                    h2 {
                        font-size: 18pt;
                        font-weight: bold;
                        text-align: center;
                        margin-top: 0;
                        margin-bottom: 16pt;
                    }
                    h3 {
                        font-size: 16pt;
                        font-weight: bold;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 14pt;
                        margin-bottom: 6pt;
                    }
                    h4 {
                        font-size: 16pt;
                        font-weight: bold;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 8pt;
                        margin-bottom: 4pt;
                    }
                    .academic-subheading {
                        font-size: 16pt !important;
                        font-weight: bold !important;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 10pt;
                        margin-bottom: 3pt;
                        padding-left: 0.75cm;
                    }
                    .academic-subheading * {
                        text-align: left !important;
                        text-justify: none !important;
                    }
                    p {
                        font-size: 16pt;
                        line-height: 1.65;
                        margin-top: 0;
                        margin-bottom: 6pt;
                        text-align: justify;
                        text-justify: inter-cluster;
                    }
                    .thai-indent {
                        text-indent: 1.5cm;
                    }
                    .thai-hanging-indent {
                        padding-left: 1.5cm;
                        text-indent: -1.5cm;
                    }
                    .text-left {
                        text-align: left !important;
                        text-justify: none !important;
                    }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${a.innerHTML}
                </div>
            </body>
            </html>
        `,x=new Blob(["\uFEFF",_],{type:"application/msword;charset=utf-8"}),y=URL.createObjectURL(x),j=document.createElement("a");j.href=y,j.download=`${N}.doc`,document.body.appendChild(j),j.click(),document.body.removeChild(j),URL.revokeObjectURL(y)},b=e=>e?e.split(/(\*\*[^*]+\*\*)/g).map((a,N)=>a.startsWith("**")&&a.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:a.slice(2,-2)},N):a):null,u=(e,s="")=>{if(!e)return null;let a=h(e);const N=new RegExp(`^(?:#*\\s*)?(?:${s}|1\\.[1-6])\\s*[^\\n]*\\n*`,"u");a=a.replace(N,"").trim();const _=a.split(/\r?\n/),x=[];let y=[];const j=w=>{let n="";for(let p=0;p<w.length;p++){const f=w[p].trim();if(f)if(!n)n=f;else{const v=n.slice(-1),T=f.charAt(0),S=/[\u0E00-\u0E7F]/.test(v),k=/[\u0E00-\u0E7F]/.test(T);S&&k?n+=f:n+=" "+f}}return n},c=w=>{if(y.length>0){const n=j(y).trim();n&&x.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",style:{textAlign:"justify",textJustify:"inter-cluster"},children:b(n)},`p-${w}`)),y=[]}};return _.forEach((w,n)=>{const p=w.trim();if(!p){c(n);return}const f=p.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);if(f){c(n),x.push(t.jsxs("div",{className:"academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start",style:{textAlign:"left",textJustify:"none"},children:[t.jsx("span",{className:"shrink-0 mr-2 font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:f[1]}),t.jsx("span",{className:"flex-1 text-left font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:b(f[2])})]},`subsec-${n}`));return}const v=p.match(/^\(([0-9]+)\)\s+(.*)$/u);if(v){c(n);const m=v[1],l=v[2],d=l.indexOf(":");let g="",z=l;d!==-1&&d<80&&(g=l.slice(0,d+1),z=l.slice(d+1).trim()),x.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",style:{textAlign:"left"},children:["(",m,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[g&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:g}),t.jsx("span",{children:b(z)})]})]},`subnum-${n}`));return}const T=p.match(/^[-•]\s+(.*)$/u);if(T){c(n);const m=T[1],l=m.indexOf(":");let d="",g=m;l!==-1&&l<60&&(d=m.slice(0,l+1),g=m.slice(l+1).trim()),x.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",style:{textAlign:"left"},children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[d&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:d}),t.jsx("span",{children:b(g)})]})]},`bullet-${n}`));return}const S=p.match(/^(\d+)\.\s+(.+)$/u);if(S){c(n);const m=S[1],l=S[2];x.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{minWidth:"24px",textAlign:"left"},children:[m,"."]}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:b(l)})]},`num-${n}`));return}const k=p.match(/^(\d+\))\s+(.+)$/u);if(k){c(n);const m=k[1],l=k[2],d=l.indexOf(":");if(d!==-1&&d<80){const g=l.slice(0,d+1),z=l.slice(d+1).trim();z?x.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:m}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:g}),t.jsx("span",{children:b(z)})]})]},`itemp-${n}`)):x.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left",style:{textAlign:"left",textJustify:"auto"},children:t.jsxs("span",{children:[m," ",g]})},`itemp-${n}`))}else x.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:m}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:b(l)})]},`itemp-${n}`));return}y.push(p)}),c(_.length),t.jsx("div",{className:"space-y-1",children:x})},C=Array.isArray(i.objectives)?i.objectives:i.objectives?[i.objectives]:[],E=Array.isArray(i.expected_benefits)?i.expected_benefits:i.expected_benefits?[i.expected_benefits]:[],J=Array.isArray(i.targets)?i.targets:i.targets?[i.targets]:[],F=Array.isArray(i.activities)?i.activities:[];return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(W,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 1 - ${i.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${$.docSize};
                    --doc-line-height: ${$.lineHeight};
                    --title-font-size: ${$.titleSize};
                    --heading-font-size: ${$.headingSize};
                }

                .font-sarabun {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .thai-indent {
                    text-indent: 1.5cm !important;
                }

                .thai-hanging-indent {
                    padding-left: 1.5cm !important;
                    text-indent: -1.5cm !important;
                }

                .thai-content {
                    text-align: justify !important;
                    text-justify: inter-cluster !important;
                    line-height: var(--doc-line-height) !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box !important;
                    width: 210mm !important;
                    max-width: 100% !important;
                    min-height: 297mm;
                    padding-left: 1in !important;
                    padding-right: 1in !important;
                    padding-top: 1in !important;
                    padding-bottom: 1in !important;
                    background: #ffffff !important;
                }

                @media (max-width: 768px) {
                    .print-doc-container {
                        padding-left: 0.5in !important;
                        padding-right: 0.5in !important;
                        padding-top: 0.5in !important;
                        padding-bottom: 0.5in !important;
                    }
                }

                .print-title {
                    font-size: var(--title-font-size) !important;
                    font-weight: bold !important;
                    line-height: 1.3 !important;
                }

                .print-heading {
                    font-size: var(--heading-font-size) !important;
                    font-weight: bold !important;
                    line-height: 1.4 !important;
                    text-align: left !important;
                    text-justify: none !important;
                }

                .academic-subheading {
                    text-align: left !important;
                    text-justify: none !important;
                    font-weight: bold !important;
                }

                .academic-subheading * {
                    text-align: left !important;
                    text-justify: none !important;
                }

                h1, h2, h3, h4 {
                    text-align: left !important;
                    text-justify: none !important;
                }

                .print-title {
                    text-align: center !important;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin-top: 1in !important;
                        margin-bottom: 1in !important;
                        margin-left: 1in !important;
                        margin-right: 1in !important;
                    }
                    html, body {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                        font-size: var(--doc-font-size) !important;
                        line-height: var(--doc-line-height) !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-doc-container {
                        font-size: var(--doc-font-size) !important;
                        line-height: var(--doc-line-height) !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: auto !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    h1, h2, h3, h4 {
                        break-after: avoid;
                        page-break-after: avoid;
                    }
                }
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📘"})," รายงานผลโครงการ: บทที่ 1 บทนำ (Introduction)"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน 5 บท"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>H("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${A==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>H("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${A==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>H("large"),className:`px-2.5 py-1 rounded-lg transition-all ${A==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการฉบับเต็ม",children:"📄 แบบเสนอโครงการ"}),t.jsx(q,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{type:"button",onClick:()=>O(`รายงานผลโครงการ_บทที่_1_${i.title||""}`),className:"rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 1 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{onClick:L,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 1"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"บทนำ"})]}),P?t.jsx("div",{className:"space-y-4 text-black",children:u(P,"บทที่ 1")}):t.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.1 ความเป็นมาและความสำคัญของปัญหา"}),t.jsx("div",{children:u(r(o.background)||r(i.background_rationale)||"ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา","1.1")})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.2 วัตถุประสงค์ของโครงการ"}),t.jsx("div",{className:"space-y-1.5",children:o.objectives?u(r(o.objectives),"1.2"):C.length>0?C.map((e,s)=>t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed",children:[t.jsxs("span",{className:"font-bold shrink-0 w-12 sm:w-14",children:["1.2.",h(s+1)]}),t.jsx("span",{className:"flex-1",children:h(r(e))})]},s)):t.jsx("div",{className:"thai-indent",children:"ไม่ได้ระบุวัตถุประสงค์โครงการ"})})]}),t.jsxs("div",{className:"print-break-inside-avoid space-y-4",children:[t.jsx("h3",{className:"print-heading text-black mb-1",children:"1.3 ขอบเขตของโครงการ"}),t.jsxs("div",{className:"pl-2 sm:pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.1 ขอบเขตด้านประชากรและกลุ่มเป้าหมาย"}),t.jsx("div",{children:u(r(o.scope_target)||(J.length>0?J.map(e=>r(e)).filter(Boolean).join(", "):"นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง"),"1.3.1")})]}),t.jsxs("div",{className:"pl-2 sm:pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.2 ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน"}),t.jsx("div",{children:u(r(o.scope_content)||(F.length>0?F.map((e,s)=>`${h(s+1)}. ${r(e)}`).join(`
`):"ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ"),"1.3.2")})]}),t.jsxs("div",{className:"pl-2 sm:pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.3 ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ"}),t.jsx("div",{children:u(r(o.scope_location_time)||`สถานที่ดำเนินโครงการ: ${i.location||"วิทยาลัยสารพัดช่างน่าน"} `+(i.start_date?`ระยะเวลาตั้งแต่วันที่ ${h(i.start_date)} ถึง ${h(i.end_date||i.start_date)}`:""),"1.3.3")})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ"}),t.jsxs("div",{className:"space-y-2 pl-2 sm:pl-4",children:[t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1 text-justify leading-relaxed",children:[t.jsx("span",{className:"font-bold shrink-0 w-28 sm:w-32",children:"1.4.1 ตัวชี้วัดเชิงปริมาณ:"}),t.jsx("span",{className:"flex-1",children:h(r(o.indicators_quantitative)||r(i.indicators?.quantitative)||"ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย")})]}),t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1 text-justify leading-relaxed",children:[t.jsx("span",{className:"font-bold shrink-0 w-28 sm:w-32",children:"1.4.2 ตัวชี้วัดเชิงคุณภาพ:"}),t.jsx("span",{className:"flex-1",children:h(r(o.indicators_qualitative)||r(i.indicators?.qualitative)||"ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย 3.51 ขึ้นไป)")})]})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.5 ประโยชน์ที่คาดว่าจะได้รับ"}),t.jsx("div",{className:"space-y-1.5",children:o.benefits||o.expected_benefits?u(r(o.benefits||o.expected_benefits),"1.5"):E.length>0?E.map((e,s)=>t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed",children:[t.jsxs("span",{className:"font-bold shrink-0 w-12 sm:w-14",children:["1.5.",h(s+1)]}),t.jsx("span",{className:"flex-1",children:h(r(e))})]},s)):t.jsx("div",{className:"thai-indent",children:"การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา"})})]}),o.definitions&&t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.6 นิยามศัพท์เฉพาะ"}),t.jsx("div",{children:u(r(o.definitions),"1.6")})]})]})]})]})}export{B as default};

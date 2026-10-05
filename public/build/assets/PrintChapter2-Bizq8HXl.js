import{r as F,j as t,H as J,L as P}from"./app-2vMu-5di.js";function R({project:f}){const[k,$]=F.useState("normal"),a=f?.chapter_2_sections||{},T=f?.chapter_2_content||"",H=i=>{if(i==null)return"";const m={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(i).replace(/[๐-๙]/g,s=>m[s]||s)},C=()=>{window.print()},z={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[k],E=(i="รายงานผลโครงการ_บทที่_2")=>{const m=document.querySelector(".print-doc-container");if(!m)return;const s=m.cloneNode(!0);s.querySelectorAll(".no-print").forEach(l=>l.remove()),s.querySelectorAll(".academic-subheading").forEach(l=>{l.setAttribute("align","left"),l.style.textAlign="left",l.style.textJustify="none"});const b=(i||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),_=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${b}</title>
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
                    ${s.innerHTML}
                </div>
            </body>
            </html>
        `,c=new Blob(["\uFEFF",_],{type:"application/msword;charset=utf-8"}),g=URL.createObjectURL(c),u=document.createElement("a");u.href=g,u.download=`${b}.doc`,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(g)},h=i=>i?i.split(/(\*\*[^*]+\*\*)/g).map((s,b)=>s.startsWith("**")&&s.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:s.slice(2,-2)},b):s):null,j=(i,m="")=>{if(!i)return null;let s=H(i);const b=new RegExp(`^(?:#*\\s*)?(?:${m}|2\\.[1-4])\\s*[^\\n]*\\n*`,"u");s=s.replace(b,"").trim();const _=s.split(/\r?\n/),c=[];let g=[];const u=y=>{let e="";for(let d=0;d<y.length;d++){const p=y[d].trim();if(p)if(!e)e=p;else{const w=e.slice(-1),A=p.charAt(0),N=/[\u0E00-\u0E7F]/.test(w),v=/[\u0E00-\u0E7F]/.test(A);N&&v?e+=p:e+=" "+p}}return e},l=y=>{if(g.length>0){const e=u(g).trim();e&&c.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(e)},`p-${y}`)),g=[]}};return _.forEach((y,e)=>{const d=y.trim();if(!d){l(e);return}const p=d.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);if(p){l(e),c.push(t.jsxs("div",{className:"academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start",style:{textAlign:"left",textJustify:"none"},children:[t.jsx("span",{className:"shrink-0 mr-2 font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:p[1]}),t.jsx("span",{className:"flex-1 text-left font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:h(p[2])})]},`subsec-${e}`));return}const w=d.match(/^\(([0-9]+)\)\s+(.*)$/u);if(w){l(e);const o=w[1],n=w[2],r=n.indexOf(":");let x="",S=n;r!==-1&&r<80&&(x=n.slice(0,r+1),S=n.slice(r+1).trim()),c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",style:{textAlign:"left"},children:["(",o,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[x&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:h(S)})]})]},`subnum-${e}`));return}const A=d.match(/^[-•]\s+(.*)$/u);if(A){l(e);const o=A[1],n=o.indexOf(":");let r="",x=o;n!==-1&&n<60&&(r=o.slice(0,n+1),x=o.slice(n+1).trim()),c.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",style:{textAlign:"left"},children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[r&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:r}),t.jsx("span",{children:h(x)})]})]},`bullet-${e}`));return}const N=d.match(/^(\d+)\.\s+(.+)$/u);if(N){l(e);const o=N[1],n=N[2];c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{minWidth:"24px",textAlign:"left"},children:[o,"."]}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(n)})]},`num-${e}`));return}const v=d.match(/^(\d+\))\s+(.+)$/u);if(v){l(e);const o=v[1],n=v[2],r=n.indexOf(":");if(r!==-1&&r<80){const x=n.slice(0,r+1),S=n.slice(r+1).trim();S?c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:o}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:h(S)})]})]},`itemp-${e}`)):c.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left",style:{textAlign:"left",textJustify:"auto"},children:t.jsxs("span",{children:[o," ",x]})},`itemp-${e}`))}else c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:o}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(n)})]},`itemp-${e}`));return}g.push(d)}),l(_.length),t.jsx("div",{className:"space-y-1",children:c})};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(J,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 2 - ${f.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${z.docSize};
                    --doc-line-height: ${z.lineHeight};
                    --title-font-size: ${z.titleSize};
                    --heading-font-size: ${z.headingSize};
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
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📖"})," รายงานผลโครงการ: บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>$("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${k==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>$("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${k==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>$("large"),className:`px-2.5 py-1 rounded-lg transition-all ${k==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.print",f.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการ / บทที่ 1",children:"📄 พิมพ์แบบเสนอ (บทที่ 1)"}),t.jsx(P,{href:route("projects.show",f.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{type:"button",onClick:()=>E(`รายงานผลโครงการ_บทที่_2_${f.title||""}`),className:"rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 2 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{onClick:C,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 2"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"เอกสารและงานวิจัยที่เกี่ยวข้อง"})]}),a&&(a.section_2_1||a.section_2_2||a.section_2_3)?t.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[a.intro&&t.jsx("div",{children:j(a.intro)}),a.section_2_1&&t.jsxs("div",{className:"pt-2",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง"}),j(a.section_2_1,"2\\.1")]}),a.section_2_2&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง"}),j(a.section_2_2,"2\\.2")]}),a.section_2_3&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง"}),j(a.section_2_3,"2\\.3")]}),a.references&&t.jsxs("div",{className:"pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading mb-4 text-center text-black",children:"เอกสารอ้างอิง"}),t.jsx("div",{className:"space-y-3 leading-relaxed",children:H(a.references).replace(/^เอกสารอ้างอิง\s*\n+/u,"").split(/\n+/).filter(i=>i.trim().length>0).map((i,m)=>t.jsx("p",{className:"thai-hanging-indent text-justify",children:h(i.trim())},m))})]})]}):T?t.jsx("div",{children:j(T)}):t.jsxs("div",{className:"p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden",children:[t.jsx("p",{className:"text-amber-800 font-bold",children:"ยังไม่มีเนื้อหาบทที่ 2 ในระบบ"}),t.jsx("p",{className:"text-xs text-amber-600 mt-1",children:'กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ 4 (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ 2"'}),t.jsx(P,{href:route("projects.show",f.id),className:"mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow",children:"กลับไปสร้างเนื้อหาบทที่ 2"})]})]})]})}export{R as default};

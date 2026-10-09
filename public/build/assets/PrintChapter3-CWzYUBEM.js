import{r as F,j as t,H as J,L as T}from"./app-CaaDVulz.js";function M({project:b}){const[_,$]=F.useState("normal"),n=b?.chapter_3_sections||{},P=b?.chapter_3_content||"",C=o=>{if(o==null)return"";const f={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(o).replace(/[๐-๙]/g,s=>f[s]||s)},H=()=>{window.print()},k={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[_],E=(o="รายงานผลโครงการ_บทที่_3")=>{const f=document.querySelector(".print-doc-container");if(!f)return;const s=f.cloneNode(!0);s.querySelectorAll(".no-print").forEach(a=>a.remove()),s.querySelectorAll(".academic-subheading").forEach(a=>{a.setAttribute("align","left"),a.style.textAlign="left",a.style.textJustify="none"});const y=(o||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),z=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${y}</title>
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
        `,c=new Blob(["\uFEFF",z],{type:"application/msword;charset=utf-8"}),g=URL.createObjectURL(c),u=document.createElement("a");u.href=g,u.download=`${y}.doc`,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(g)},p=o=>o?o.split(/(\*\*[^*]+\*\*)/g).map((s,y)=>s.startsWith("**")&&s.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:s.slice(2,-2)},y):s):null,h=(o,f="")=>{if(!o)return null;let s=C(o);const y=new RegExp(`^(?:#*\\s*)?(?:${f}|3\\.[1-5])\\s*[^\\n]*\\n*`,"u");s=s.replace(y,"").trim();const z=s.split(/\r?\n/),c=[];let g=[];const u=j=>{let e="";for(let d=0;d<j.length;d++){const m=j[d].trim();if(m)if(!e)e=m;else{const w=e.slice(-1),A=m.charAt(0),N=/[\u0E00-\u0E7F]/.test(w),v=/[\u0E00-\u0E7F]/.test(A);N&&v?e+=m:e+=" "+m}}return e},a=j=>{if(g.length>0){const e=u(g).trim();e&&c.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",style:{textAlign:"justify",textJustify:"inter-cluster"},children:p(e)},`p-${j}`)),g=[]}};return z.forEach((j,e)=>{const d=j.trim();if(!d){a(e);return}const m=d.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);if(m){a(e),c.push(t.jsxs("div",{className:"academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start",style:{textAlign:"left",textJustify:"none"},children:[t.jsx("span",{className:"shrink-0 mr-2 font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:m[1]}),t.jsx("span",{className:"flex-1 text-left font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:p(m[2])})]},`subsec-${e}`));return}const w=d.match(/^\(([0-9]+)\)\s+(.*)$/u);if(w){a(e);const r=w[1],i=w[2],l=i.indexOf(":");let x="",S=i;l!==-1&&l<80&&(x=i.slice(0,l+1),S=i.slice(l+1).trim()),c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",style:{textAlign:"left"},children:["(",r,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[x&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:p(S)})]})]},`subnum-${e}`));return}const A=d.match(/^[-•]\s+(.*)$/u);if(A){a(e);const r=A[1],i=r.indexOf(":");let l="",x=r;i!==-1&&i<60&&(l=r.slice(0,i+1),x=r.slice(i+1).trim()),c.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",style:{textAlign:"left"},children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[l&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:l}),t.jsx("span",{children:p(x)})]})]},`bullet-${e}`));return}const N=d.match(/^(\d+)\.\s+(.+)$/u);if(N){a(e);const r=N[1],i=N[2];c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{minWidth:"24px",textAlign:"left"},children:[r,"."]}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:p(i)})]},`num-${e}`));return}const v=d.match(/^(\d+\))\s+(.+)$/u);if(v){a(e);const r=v[1],i=v[2],l=i.indexOf(":");if(l!==-1&&l<80){const x=i.slice(0,l+1),S=i.slice(l+1).trim();S?c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:r}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:p(S)})]})]},`itemp-${e}`)):c.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left",style:{textAlign:"left",textJustify:"auto"},children:t.jsxs("span",{children:[r," ",x]})},`itemp-${e}`))}else c.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:r}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:p(i)})]},`itemp-${e}`));return}g.push(d)}),a(z.length),t.jsx("div",{className:"space-y-1",children:c})};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(J,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 3 - ${b.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${k.docSize};
                    --doc-line-height: ${k.lineHeight};
                    --title-font-size: ${k.titleSize};
                    --heading-font-size: ${k.headingSize};
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
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📙"})," รายงานผลโครงการ: บทที่ 3 วิธีดำเนินงานโครงการ (PDCA Methodology)"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>$("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${_==="compact"?"bg-amber-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>$("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${_==="normal"?"bg-amber-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>$("large"),className:`px-2.5 py-1 rounded-lg transition-all ${_==="large"?"bg-amber-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.chapter2.print",b.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition shadow-2xs",title:"ดูรายงานผลโครงการ บทที่ 2",children:"📗 ดูบทที่ 2"}),t.jsx(T,{href:route("projects.show",b.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{type:"button",onClick:()=>E(`รายงานผลโครงการ_บทที่_3_${b.title||""}`),className:"rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 3 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{onClick:H,className:"rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-700 hover:to-orange-700 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 3"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"วิธีดำเนินงานโครงการ"})]}),n&&(n.section_3_1||n.section_3_2||n.section_3_3)?t.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[n.intro&&t.jsx("div",{children:h(n.intro)}),n.section_3_1&&t.jsxs("div",{className:"pt-2",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"3.1 ประชากรและกลุ่มตัวอย่าง / กลุ่มเป้าหมาย"}),h(n.section_3_1,"3\\.1")]}),n.section_3_2&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"3.2 เครื่องมือที่ใช้ในการประเมินผลโครงการ"}),h(n.section_3_2,"3\\.2")]}),n.section_3_3&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"3.3 ขั้นตอนและกิจกรรมการดำเนินงานตามวงจรคุณภาพ PDCA"}),h(n.section_3_3,"3\\.3")]}),n.section_3_4&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"3.4 การเก็บรวบรวมข้อมูล"}),h(n.section_3_4,"3\\.4")]}),n.section_3_5&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"3.5 สถิติที่ใช้ในการวิเคราะห์ข้อมูล"}),h(n.section_3_5,"3\\.5")]})]}):P?t.jsx("div",{children:h(P)}):t.jsxs("div",{className:"p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden",children:[t.jsx("p",{className:"text-amber-800 font-bold",children:"ยังไม่มีเนื้อหาบทที่ 3 ในระบบ"}),t.jsx("p",{className:"text-xs text-amber-600 mt-1",children:'กรุณากลับไปที่หน้ารายงานผลโครงการ แท็บ "บทที่ 3 (Methodology)" และกดปุ่ม "🤖 ใช้ AI วิเคราะห์และช่วยเขียนบทที่ 3"'}),t.jsx(T,{href:route("dashboard",{chapter:3}),className:"mt-4 inline-block px-4 py-2 bg-amber-700 text-white font-bold text-xs rounded-xl shadow",children:"กลับไปสร้างเนื้อหาบทที่ 3"})]})]})]})}export{M as default};

import{r as j,j as t,H as y,L as x}from"./app-DIjGn7qZ.js";function N({project:i}){const[l,c]=j.useState("normal"),e=i?.chapter_2_sections||{},p=i?.chapter_2_content||"",a=n=>{if(n==null)return"";const r={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(n).replace(/[๐-๙]/g,o=>r[o]||o)},g=()=>{window.print()},d={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[l],b=(n="รายงานผลโครงการ_บทที่_2")=>{const r=document.querySelector(".print-doc-container");if(!r)return;const o=r.cloneNode(!0);o.querySelectorAll(".no-print").forEach(w=>w.remove());const m=(n||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),f=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${m}</title>
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
                        margin-top: 14pt;
                        margin-bottom: 6pt;
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
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${o.innerHTML}
                </div>
            </body>
            </html>
        `,u=new Blob(["\uFEFF",f],{type:"application/msword;charset=utf-8"}),h=URL.createObjectURL(u),s=document.createElement("a");s.href=h,s.download=`${m}.doc`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(h)};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(y,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 2 - ${i.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${d.docSize};
                    --doc-line-height: ${d.lineHeight};
                    --title-font-size: ${d.titleSize};
                    --heading-font-size: ${d.headingSize};
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
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📖"})," รายงานผลโครงการ: บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>c("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>c("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>c("large"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการ / บทที่ 1",children:"📄 พิมพ์แบบเสนอ (บทที่ 1)"}),t.jsx(x,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{type:"button",onClick:()=>b(`รายงานผลโครงการ_บทที่_2_${i.title||""}`),className:"rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 2 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{onClick:g,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 2"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"เอกสารและงานวิจัยที่เกี่ยวข้อง"})]}),e&&(e.section_2_1||e.section_2_2||e.section_2_3)?t.jsxs("div",{className:"space-y-6 text-justify text-black leading-relaxed",children:[e.intro&&t.jsx("div",{className:"thai-indent whitespace-pre-line text-justify leading-relaxed",children:a(e.intro)}),e.section_2_1&&t.jsxs("div",{className:"pt-2",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง"}),t.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:a(e.section_2_1.replace(/^[๒2]\.[๑1]\s*แนวคิด[^\n]*\n+/u,""))})]}),e.section_2_2&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง"}),t.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:a(e.section_2_2.replace(/^[๒2]\.[๒2]\s*ยุทธศาสตร์[^\n]*\n+/u,""))})]}),e.section_2_3&&t.jsxs("div",{className:"pt-4",children:[t.jsx("h3",{className:"print-heading mb-2 text-black",children:"2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง"}),t.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:a(e.section_2_3.replace(/^[๒2]\.[๓3]\s*เอกสาร[^\n]*\n+/u,""))})]}),e.references&&t.jsxs("div",{className:"pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading mb-4 text-center text-black",children:"เอกสารอ้างอิง"}),t.jsx("div",{className:"space-y-3 leading-relaxed",children:a(e.references).replace(/^เอกสารอ้างอิง\s*\n+/u,"").split(/\n+/).filter(n=>n.trim().length>0).map((n,r)=>t.jsx("p",{className:"thai-hanging-indent text-justify",children:n.trim()},r))})]})]}):p?t.jsx("div",{className:"whitespace-pre-line text-justify text-black leading-relaxed space-y-4 thai-indent",children:a(p)}):t.jsxs("div",{className:"p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden",children:[t.jsx("p",{className:"text-amber-800 font-bold",children:"ยังไม่มีเนื้อหาบทที่ 2 ในระบบ"}),t.jsx("p",{className:"text-xs text-amber-600 mt-1",children:'กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ 4 (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ 2"'}),t.jsx(x,{href:route("projects.show",i.id),className:"mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow",children:"กลับไปสร้างเนื้อหาบทที่ 2"})]})]})]})}export{N as default};

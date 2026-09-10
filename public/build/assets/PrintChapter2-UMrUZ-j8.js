import{r as p,j as e,H as x,L as o}from"./app-irBa_-4g.js";function m({project:i}){const[n,s]=p.useState("normal"),t=i?.chapter_2_sections||{},l=i?.chapter_2_content||"",d=()=>{window.print()},a={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[n];return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(x,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ ๒ - ${i.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${a.docSize};
                    --doc-line-height: ${a.lineHeight};
                    --title-font-size: ${a.titleSize};
                    --heading-font-size: ${a.headingSize};
                }

                .font-sarabun {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .thai-indent {
                    text-indent: 2.5cm !important;
                }

                .thai-hanging-indent {
                    padding-left: 1.5cm !important;
                    text-indent: -1.5cm !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box;
                }

                .print-title {
                    font-size: var(--title-font-size) !important;
                    font-weight: bold !important;
                }

                .print-heading {
                    font-size: var(--heading-font-size) !important;
                    font-weight: bold !important;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1in !important;
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
            `}),e.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[e.jsx("span",{children:"📖"})," รายงานผลโครงการ: บทที่ ๒ เอกสารและงานวิจัยที่เกี่ยวข้อง"]}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน ๑ นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับแบบเสนอโครงการ"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[e.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),e.jsx("button",{type:"button",onClick:()=>s("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${n==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),e.jsx("button",{type:"button",onClick:()=>s("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${n==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),e.jsx("button",{type:"button",onClick:()=>s("large"),className:`px-2.5 py-1 rounded-lg transition-all ${n==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),e.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการ / บทที่ ๑",children:"📄 พิมพ์แบบเสนอ (บทที่ ๑)"}),e.jsx(o,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),e.jsxs("button",{onClick:d,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[e.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[e.jsxs("div",{className:"text-center mb-8 pb-4 border-b border-slate-200 print:border-none",children:[e.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ ๒"}),e.jsx("h1",{className:"print-title tracking-wide text-black",children:"เอกสารและงานวิจัยที่เกี่ยวข้อง"}),e.jsxs("p",{className:"text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2",children:["โครงการ: ",i.title]})]}),t&&(t.section_2_1||t.section_2_2||t.section_2_3)?e.jsxs("div",{className:"space-y-6 text-justify text-black leading-relaxed",children:[t.intro&&e.jsx("div",{className:"thai-indent whitespace-pre-line text-justify leading-relaxed",children:t.intro}),t.section_2_1&&e.jsxs("div",{className:"pt-2",children:[e.jsx("h3",{className:"print-heading mb-2 text-black",children:"๒.๑ แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:t.section_2_1.replace(/^[๒2]\.[๑1]\s*แนวคิด[^\n]*\n+/u,"")})]}),t.section_2_2&&e.jsxs("div",{className:"pt-4",children:[e.jsx("h3",{className:"print-heading mb-2 text-black",children:"๒.๒ ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:t.section_2_2.replace(/^[๒2]\.[๒2]\s*ยุทธศาสตร์[^\n]*\n+/u,"")})]}),t.section_2_3&&e.jsxs("div",{className:"pt-4",children:[e.jsx("h3",{className:"print-heading mb-2 text-black",children:"๒.๓ เอกสารและงานวิจัยที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line thai-indent text-justify leading-relaxed space-y-2",children:t.section_2_3.replace(/^[๒2]\.[๓3]\s*เอกสาร[^\n]*\n+/u,"")})]}),t.references&&e.jsxs("div",{className:"pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading mb-4 text-center text-black",children:"เอกสารอ้างอิง"}),e.jsx("div",{className:"space-y-3 leading-relaxed",children:t.references.replace(/^เอกสารอ้างอิง\s*\n+/u,"").split(/\n+/).filter(r=>r.trim().length>0).map((r,c)=>e.jsx("p",{className:"thai-hanging-indent text-justify",children:r.trim()},c))})]})]}):l?e.jsx("div",{className:"whitespace-pre-line text-justify text-black leading-relaxed space-y-4 thai-indent",children:l}):e.jsxs("div",{className:"p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans print:hidden",children:[e.jsx("p",{className:"text-amber-800 font-bold",children:"ยังไม่มีเนื้อหาบทที่ ๒ ในระบบ"}),e.jsx("p",{className:"text-xs text-amber-600 mt-1",children:'กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ ๔ (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ ๒"'}),e.jsx(o,{href:route("projects.show",i.id),className:"mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow",children:"กลับไปสร้างเนื้อหาบทที่ ๒"})]})]})]})}export{m as default};

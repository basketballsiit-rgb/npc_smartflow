import{r as o,j as e,H as d,L as r}from"./app-oKuJPBVs.js";function x({project:n}){const[s,a]=o.useState("normal"),t=n?.chapter_2_sections||{},i=n?.chapter_2_content||"",l=()=>{window.print()};return e.jsxs("div",{className:"min-h-screen bg-slate-100 py-6 print:py-0 print:bg-white text-slate-900 font-serif",children:[e.jsx(d,{title:`พิมพ์บทที่ ๒ - ${n.title}`}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

                :root {
                    --doc-font-size: ${s==="compact"?"14px":s==="large"?"16.5px":"15px"};
                    --doc-line-height: 1.65;
                }

                .sarabun-font {
                    font-family: 'TH Sarabun PSK', 'TH Sarabun Chula', 'THSarabunNew', 'Sarabun', sans-serif !important;
                }

                .print-doc-container {
                    font-size: var(--doc-font-size) !important;
                    line-height: var(--doc-line-height) !important;
                    box-sizing: border-box;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1in 0.8in 1in 1in !important;
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
                }
            `}),e.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[e.jsx("span",{children:"📖"})," รายงานผลโครงการ: บทที่ ๒ เอกสารและงานวิจัยที่เกี่ยวข้อง"]}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"จัดรูปแบบหัวข้อ ๒.๑, ๒.๒ (ยุทธศาสตร์ สอศ.), ๒.๓ (งานวิจัยพร้อมแหล่งอ้างอิง) และบรรณานุกรมท้ายบท"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsxs("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs",children:[e.jsx("button",{type:"button",onClick:()=>a("compact"),className:`px-2.5 py-1 rounded-lg font-bold transition-all ${s==="compact"?"bg-white shadow-xs text-purple-700 font-extrabold":"text-slate-500 hover:text-slate-800"}`,children:"ก เล็ก"}),e.jsx("button",{type:"button",onClick:()=>a("normal"),className:`px-2.5 py-1 rounded-lg font-bold transition-all ${s==="normal"?"bg-white shadow-xs text-purple-700 font-extrabold":"text-slate-500 hover:text-slate-800"}`,children:"ก ปกติ"}),e.jsx("button",{type:"button",onClick:()=>a("large"),className:`px-2.5 py-1 rounded-lg font-bold transition-all ${s==="large"?"bg-white shadow-xs text-purple-700 font-extrabold":"text-slate-500 hover:text-slate-800"}`,children:"ก ใหญ่"})]}),e.jsx(r,{href:route("projects.show",n.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),e.jsxs("button",{onClick:l,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5",children:[e.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),e.jsxs("div",{className:"print-doc-container sarabun-font max-w-4xl mx-auto bg-white p-12 md:p-16 shadow-lg print:shadow-none border border-slate-200 print:border-none rounded-2xl print:rounded-none",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h2",{className:"text-xl md:text-2xl font-bold tracking-wide text-black mb-1",children:"บทที่ ๒"}),e.jsx("h1",{className:"text-xl md:text-2xl font-bold tracking-wide text-black",children:"เอกสารและงานวิจัยที่เกี่ยวข้อง"}),e.jsxs("p",{className:"text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2",children:["โครงการ: ",n.title]})]}),t&&(t.section_2_1||t.section_2_2||t.section_2_3)?e.jsxs("div",{className:"space-y-6 text-justify text-black leading-relaxed",children:[t.intro&&e.jsx("div",{className:"whitespace-pre-line indent-8",children:t.intro}),t.section_2_1&&e.jsxs("div",{className:"pt-4",children:[e.jsx("h3",{className:"text-lg md:text-xl font-bold mb-3",children:"๒.๑ แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line pl-4 space-y-3",children:t.section_2_1.replace(/^๒\.๑\s*แนวคิด[^\n]*\n+/u,"")})]}),t.section_2_2&&e.jsxs("div",{className:"pt-4 print-break-inside-avoid",children:[e.jsx("h3",{className:"text-lg md:text-xl font-bold mb-3",children:"๒.๒ ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line pl-4 space-y-3",children:t.section_2_2.replace(/^๒\.๒\s*ยุทธศาสตร์[^\n]*\n+/u,"")})]}),t.section_2_3&&e.jsxs("div",{className:"pt-4 print-break-inside-avoid",children:[e.jsx("h3",{className:"text-lg md:text-xl font-bold mb-3",children:"๒.๓ เอกสารและงานวิจัยที่เกี่ยวข้อง"}),e.jsx("div",{className:"whitespace-pre-line pl-4 space-y-3",children:t.section_2_3.replace(/^๒\.๓\s*เอกสาร[^\n]*\n+/u,"")})]}),t.references&&e.jsxs("div",{className:"pt-8 border-t border-slate-300 print:border-black print-break-inside-avoid",children:[e.jsx("h3",{className:"text-lg md:text-xl font-bold mb-4 text-center",children:"เอกสารอ้างอิง"}),e.jsx("div",{className:"whitespace-pre-line pl-8 -indent-8 space-y-2 text-sm md:text-base leading-relaxed",children:t.references.replace(/^เอกสารอ้างอิง\s*\n+/u,"")})]})]}):i?e.jsx("div",{className:"whitespace-pre-line text-justify text-black leading-relaxed space-y-4",children:i}):e.jsxs("div",{className:"p-8 bg-amber-50 rounded-2xl border border-amber-200 text-center font-sans",children:[e.jsx("p",{className:"text-amber-800 font-bold",children:"ยังไม่มีเนื้อหาบทที่ ๒ ในระบบ"}),e.jsx("p",{className:"text-xs text-amber-600 mt-1",children:'กรุณากลับไปที่หน้ารายละเอียดโครงการ แท็บที่ ๔ (Act) และกดปุ่ม "✨ ให้ AI ช่วยค้นคว้าและร่างเนื้อหาบทที่ ๒"'}),e.jsx(r,{href:route("projects.show",n.id),className:"mt-4 inline-block px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow",children:"กลับไปสร้างเนื้อหาบทที่ ๒"})]})]})]})}export{x as default};

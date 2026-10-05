import{r as f,j as t,H as u,L as j}from"./app-6WQp27Uq.js";function v({project:i}){const[d,c]=f.useState("normal"),s=i?.chapter_1_sections||{},p=i?.chapter_1_content||"",n=e=>{if(e==null)return"";const r={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(e).replace(/[๐-๙]/g,o=>r[o]||o)},a=(e,r="")=>{if(e==null)return r;if(typeof e=="string")return e;if(typeof e=="number")return String(e);if(typeof e=="object"){if(Array.isArray(e))return e.map(o=>a(o)).filter(Boolean).join(`
`)||r;if(e.text!==void 0||e.unit!==void 0)return[e.text,e.unit].filter(Boolean).join(" ")||r;if(e.description)return String(e.description);if(e.title)return String(e.title);if(e.name)return String(e.name);try{return JSON.stringify(e)}catch{return r}}return String(e)},b=()=>{window.print()},l={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[d],h=Array.isArray(i.objectives)?i.objectives:i.objectives?[i.objectives]:[],m=Array.isArray(i.expected_benefits)?i.expected_benefits:i.expected_benefits?[i.expected_benefits]:[],x=Array.isArray(i.targets)?i.targets:i.targets?[i.targets]:[],g=Array.isArray(i.activities)?i.activities:[];return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(u,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 1 - ${i.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${l.docSize};
                    --doc-line-height: ${l.lineHeight};
                    --title-font-size: ${l.titleSize};
                    --heading-font-size: ${l.headingSize};
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
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📘"})," รายงานผลโครงการ: บทที่ 1 บทนำ (Introduction)"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน 5 บท"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>c("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>c("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>c("large"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการฉบับเต็ม",children:"📄 แบบเสนอโครงการ"}),t.jsx(j,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{onClick:b,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 1"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"บทนำ"})]}),p?t.jsx("div",{className:"space-y-6 text-black whitespace-pre-wrap leading-relaxed text-justify",children:n(p)}):t.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.1 ความเป็นมาและความสำคัญของปัญหา"}),t.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap",children:n(a(s.background)||a(i.background_rationale)||"ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา")})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.2 วัตถุประสงค์ของโครงการ"}),t.jsx("div",{className:"space-y-1 pl-6",children:s.objectives?t.jsx("div",{className:"whitespace-pre-wrap",children:n(a(s.objectives))}):h.length>0?h.map((e,r)=>t.jsxs("div",{className:"flex items-start gap-2",children:[t.jsxs("span",{className:"font-bold shrink-0",children:["1.2.",n(r+1)]}),t.jsx("span",{children:n(a(e))})]},r)):t.jsx("div",{children:"ไม่ได้ระบุวัตถุประสงค์โครงการ"})})]}),t.jsxs("div",{className:"print-break-inside-avoid space-y-3",children:[t.jsx("h3",{className:"print-heading text-black mb-1",children:"1.3 ขอบเขตของโครงการ"}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.1 ขอบเขตด้านประชากรและกลุ่มเป้าหมาย"}),t.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(a(s.scope_target)||(x.length>0?x.map(e=>a(e)).filter(Boolean).join(", "):"นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง"))})]}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.2 ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน"}),t.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(a(s.scope_content)||(g.length>0?g.map((e,r)=>`${n(r+1)}. ${a(e)}`).join(`
`):"ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ"))})]}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.3 ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ"}),t.jsx("div",{className:"thai-indent",children:n(a(s.scope_location_time)||`สถานที่ดำเนินโครงการ: ${i.location||"วิทยาลัยสารพัดช่างน่าน"} `+(i.start_date?`ระยะเวลาตั้งแต่วันที่ ${n(i.start_date)} ถึง ${n(i.end_date||i.start_date)}`:""))})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ"}),t.jsxs("div",{className:"space-y-2 pl-4",children:[t.jsxs("div",{children:[t.jsx("span",{className:"font-bold",children:"1.4.1 ตัวชี้วัดเชิงปริมาณ: "}),t.jsx("span",{children:n(a(s.indicators_quantitative)||a(i.indicators?.quantitative)||"ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย")})]}),t.jsxs("div",{children:[t.jsx("span",{className:"font-bold",children:"1.4.2 ตัวชี้วัดเชิงคุณภาพ: "}),t.jsx("span",{children:n(a(s.indicators_qualitative)||a(i.indicators?.qualitative)||"ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย 3.51 ขึ้นไป)")})]})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.5 ประโยชน์ที่คาดว่าจะได้รับ"}),t.jsx("div",{className:"space-y-1 pl-6",children:s.benefits||s.expected_benefits?t.jsx("div",{className:"whitespace-pre-wrap",children:n(a(s.benefits||s.expected_benefits))}):m.length>0?m.map((e,r)=>t.jsxs("div",{className:"flex items-start gap-2",children:[t.jsxs("span",{className:"font-bold shrink-0",children:["1.5.",n(r+1)]}),t.jsx("span",{children:n(a(e))})]},r)):t.jsx("div",{children:"การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา"})})]}),s.definitions&&t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.6 นิยามศัพท์เฉพาะ"}),t.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap",children:n(a(s.definitions))})]})]})]})]})}export{v as default};

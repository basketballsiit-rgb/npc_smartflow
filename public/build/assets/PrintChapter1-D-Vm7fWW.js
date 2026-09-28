import{r as f,j as e,H as u,L as j}from"./app-DdLr13gb.js";function N({project:i}){const[d,c]=f.useState("normal"),s=i?.chapter_1_sections||{},p=i?.chapter_1_content||"",r=t=>{if(t==null)return"";const a=["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"];return String(t).replace(/[0-9]/g,l=>a[parseInt(l,10)])},n=(t,a="")=>{if(t==null)return a;if(typeof t=="string")return t;if(typeof t=="number")return String(t);if(typeof t=="object"){if(Array.isArray(t))return t.map(l=>n(l)).filter(Boolean).join(`
`)||a;if(t.text!==void 0||t.unit!==void 0)return[t.text,t.unit].filter(Boolean).join(" ")||a;if(t.description)return String(t.description);if(t.title)return String(t.title);if(t.name)return String(t.name);try{return JSON.stringify(t)}catch{return a}}return String(t)},g=()=>{window.print()},o={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[d],h=Array.isArray(i.objectives)?i.objectives:i.objectives?[i.objectives]:[],x=Array.isArray(i.expected_benefits)?i.expected_benefits:i.expected_benefits?[i.expected_benefits]:[],m=Array.isArray(i.targets)?i.targets:i.targets?[i.targets]:[],b=Array.isArray(i.activities)?i.activities:[];return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(u,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ ๑ - ${i.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${o.docSize};
                    --doc-line-height: ${o.lineHeight};
                    --title-font-size: ${o.titleSize};
                    --heading-font-size: ${o.headingSize};
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
            `}),e.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[e.jsx("span",{children:"📘"})," รายงานผลโครงการ: บทที่ ๑ บทนำ (Introduction)"]}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน ๑ นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน ๕ บท"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[e.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),e.jsx("button",{type:"button",onClick:()=>c("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),e.jsx("button",{type:"button",onClick:()=>c("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),e.jsx("button",{type:"button",onClick:()=>c("large"),className:`px-2.5 py-1 rounded-lg transition-all ${d==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),e.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการฉบับเต็ม",children:"📄 แบบเสนอโครงการ"}),e.jsx(j,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),e.jsxs("button",{onClick:g,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[e.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[e.jsxs("div",{className:"text-center mb-8 pb-4 border-b border-slate-200 print:border-none",children:[e.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ ๑"}),e.jsx("h1",{className:"print-title tracking-wide text-black",children:"บทนำ"}),e.jsxs("p",{className:"text-sm md:text-base font-semibold text-slate-700 print:text-black mt-2",children:["โครงการ: ",i.title]}),e.jsxs("p",{className:"text-xs md:text-sm text-slate-500 print:text-black",children:["ประจำปีงบประมาณ พ.ศ. ",r(i.academic_year||new Date().getFullYear()+543)]})]}),p?e.jsx("div",{className:"space-y-6 text-black whitespace-pre-wrap leading-relaxed text-justify",children:p}):e.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[e.jsxs("div",{className:"print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading text-black mb-2",children:"๑.๑ ความเป็นมาและความสำคัญของปัญหา"}),e.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap",children:n(s.background)||n(i.background_rationale)||"ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา"})]}),e.jsxs("div",{className:"print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading text-black mb-2",children:"๑.๒ วัตถุประสงค์ของโครงการ"}),e.jsx("div",{className:"space-y-1 pl-6",children:s.objectives?e.jsx("div",{className:"whitespace-pre-wrap",children:n(s.objectives)}):h.length>0?h.map((t,a)=>e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsxs("span",{className:"font-bold shrink-0",children:["๑.๒.",r(a+1)]}),e.jsx("span",{children:n(t)})]},a)):e.jsx("div",{children:"ไม่ได้ระบุวัตถุประสงค์โครงการ"})})]}),e.jsxs("div",{className:"print-break-inside-avoid space-y-3",children:[e.jsx("h3",{className:"print-heading text-black mb-1",children:"๑.๓ ขอบเขตของโครงการ"}),e.jsxs("div",{className:"pl-4",children:[e.jsx("h4",{className:"font-bold text-black mb-1",children:"๑.๓.๑ ขอบเขตด้านประชากรและกลุ่มเป้าหมาย"}),e.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(s.scope_target)||(m.length>0?m.map(t=>n(t)).filter(Boolean).join(", "):"นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง")})]}),e.jsxs("div",{className:"pl-4",children:[e.jsx("h4",{className:"font-bold text-black mb-1",children:"๑.๓.๒ ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน"}),e.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(s.scope_content)||(b.length>0?b.map((t,a)=>`${r(a+1)}. ${n(t)}`).join(`
`):"ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ")})]}),e.jsxs("div",{className:"pl-4",children:[e.jsx("h4",{className:"font-bold text-black mb-1",children:"๑.๓.๓ ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ"}),e.jsx("div",{className:"thai-indent",children:n(s.scope_location_time)||`สถานที่ดำเนินโครงการ: ${i.location||"วิทยาลัยสารพัดช่างน่าน"} `+(i.start_date?`ระยะเวลาตั้งแต่วันที่ ${r(i.start_date)} ถึง ${r(i.end_date||i.start_date)}`:"")})]})]}),e.jsxs("div",{className:"print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading text-black mb-2",children:"๑.๔ ตัวชี้วัดและเป้าหมายความสำเร็จ"}),e.jsxs("div",{className:"space-y-2 pl-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-bold",children:"๑.๔.๑ ตัวชี้วัดเชิงปริมาณ: "}),e.jsx("span",{children:n(s.indicators_quantitative)||n(i.indicators?.quantitative)||"ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ ๘๐ ของกลุ่มเป้าหมาย"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-bold",children:"๑.๔.๒ ตัวชี้วัดเชิงคุณภาพ: "}),e.jsx("span",{children:n(s.indicators_qualitative)||n(i.indicators?.qualitative)||"ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย ๓.๕๑ ขึ้นไป)"})]})]})]}),e.jsxs("div",{className:"print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading text-black mb-2",children:"๑.๕ ประโยชน์ที่คาดว่าจะได้รับ"}),e.jsx("div",{className:"space-y-1 pl-6",children:s.benefits||s.expected_benefits?e.jsx("div",{className:"whitespace-pre-wrap",children:n(s.benefits||s.expected_benefits)}):x.length>0?x.map((t,a)=>e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsxs("span",{className:"font-bold shrink-0",children:["๑.๕.",r(a+1)]}),e.jsx("span",{children:n(t)})]},a)):e.jsx("div",{children:"การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา"})})]}),s.definitions&&e.jsxs("div",{className:"print-break-inside-avoid",children:[e.jsx("h3",{className:"print-heading text-black mb-2",children:"๑.๖ นิยามศัพท์เฉพาะ"}),e.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap",children:n(s.definitions)})]})]})]})]})}export{N as default};

import{r as p,j as t,H as m,L as h}from"./app-MsBdLA7Y.js";function b({project:e,survey:x,surveyStats:g}){const[r,l]=p.useState("normal"),a=e?.chapter_5_sections||{};e?.chapter_5_content;const n=i=>{if(i==null)return"";const c={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(i).replace(/[๐-๙]/g,o=>c[o]||o)},d=()=>{window.print()},s={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[r];return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(m,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 5 - ${e.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${s.docSize};
                    --doc-line-height: ${s.lineHeight};
                    --title-font-size: ${s.titleSize};
                    --heading-font-size: ${s.headingSize};
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
                        margin: 1in;
                    }
                    body {
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-doc-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: auto !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}),t.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx(h,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),t.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(i=>t.jsx("button",{type:"button",onClick:()=>l(i),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${r===i?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:i==="compact"?"ก เล็ก":i==="normal"?"ก ปานกลาง":"ก ใหญ่"},i))}),t.jsxs("button",{type:"button",onClick:d,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h1",{className:"print-title mb-2",children:"บทที่ 5"}),t.jsx("h2",{className:"print-heading",children:"สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsx("div",{className:"thai-content thai-indent mb-6",children:n(a.intro||`การดำเนินงานโครงการ "${e.title}" ประจำปีการศึกษา ${n(e.academic_year)} ของ${e.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้`)}),t.jsxs("div",{className:"mb-6 space-y-2",children:[t.jsx("h3",{className:"print-heading font-bold",children:"5.1 สรุปผลการดำเนินโครงการ"}),t.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:n(a.section_5_1||`การดำเนินงานโครงการ "${e.title}" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณได้อย่างครบถ้วนสมบูรณ์`)})]}),t.jsxs("div",{className:"mb-6 space-y-2",children:[t.jsx("h3",{className:"print-heading font-bold",children:"5.2 การอภิปรายผลการดำเนินโครงการ"}),t.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:n(a.section_5_2||`จากผลการดำเนินโครงการ "${e.title}" สามารถนำมาอภิปรายผลตามกรอบวัตถุประสงค์และทฤษฎีที่เกี่ยวข้องในบทที่ 2 ได้อย่างสอดคล้อง`)})]}),t.jsxs("div",{className:"mb-6 space-y-2",children:[t.jsx("h3",{className:"print-heading font-bold",children:"5.3 ปัญหา อุปสรรค และแนวทางแก้ไข"}),t.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:n(a.section_5_3||"จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขที่คณะผู้ดำเนินงานได้แก้ไขปัญหาอย่างมีประสิทธิภาพ")})]}),t.jsxs("div",{className:"mb-8 space-y-2",children:[t.jsx("h3",{className:"print-heading font-bold",children:"5.4 ข้อเสนอแนะ"}),t.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:n(a.section_5_4||"ข้อเสนอแนะในการนำผลไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป")})]}),t.jsx("div",{className:"mt-12 pt-6 flex justify-end page-break-inside-avoid",children:t.jsxs("div",{className:"text-center w-72 space-y-1",children:[t.jsx("p",{className:"text-xs",children:"ลงชื่อ........................................................"}),t.jsxs("p",{className:"text-xs font-bold",children:["(",e.user?.name||e.responsible_person||"ผู้รับผิดชอบโครงการ",")"]}),t.jsx("p",{className:"text-xs text-slate-600",children:"ผู้รับผิดชอบโครงการ"}),t.jsx("p",{className:"text-xs text-slate-500 mt-2",children:"วันที่ ..... เดือน .................... พ.ศ. ........"})]})})]})]})}export{b as default};

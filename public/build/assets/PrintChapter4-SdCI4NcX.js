import{r as N,j as e,H as y,L as u,R as w}from"./app-Bc7FyL-c.js";function z({project:a,survey:v,surveyStats:s}){const[m,g]=N.useState("normal"),l=a?.chapter_4_sections||{};a?.chapter_4_content;const t=r=>{if(r==null)return"";const x={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(r).replace(/[๐-๙]/g,n=>x[n]||n)},j=()=>{window.print()},d={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[m],h=s?.questionsStats||[],f=s?.dimensionStats||{},o=s?.demographicStats||{},c=s?.chapter1Comparison||null,p=s?.totalResponses||0;return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(y,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ 4 - ${a.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
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
            `}),e.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(u,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),e.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 4: ผลการดำเนินงานโครงการ"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(r=>e.jsx("button",{type:"button",onClick:()=>g(r),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${m===r?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:r==="compact"?"ก เล็ก":r==="normal"?"ก ปานกลาง":"ก ใหญ่"},r))}),e.jsxs("button",{type:"button",onClick:j,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2",children:[e.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h1",{className:"print-title mb-2",children:"บทที่ 4"}),e.jsx("h2",{className:"print-heading",children:"ผลการดำเนินงานโครงการ"})]}),e.jsx("div",{className:"thai-content thai-indent mb-6",children:t(`การดำเนินงานโครงการ "${a.title}" ประจำปีการศึกษา ${t(a.academic_year)} ของ${a.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้`)}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:t(l.section_4_1||`การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${a.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${t(p)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ 4.0`)}),p>0&&o&&e.jsxs("div",{className:"my-4",children:[e.jsxs("p",{className:"text-center font-bold text-xs mb-2",children:["ตารางที่ 4.0 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = ",t(p),")"]}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left w-1/2",children:"ข้อมูลทั่วไป (Demographic Profile)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"จำนวน (คน)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"ร้อยละ (%)"})]})}),e.jsxs("tbody",{children:[e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"1. เพศ (Gender)"})}),o.gender?.map(r=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:r.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(r.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(Number(r.percentage||0).toFixed(1))})]},r.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"2. ระดับการศึกษา (Education Level)"})}),o.education_level?.map(r=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:r.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(r.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(Number(r.percentage||0).toFixed(1))})]},r.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"3. สถานะของผู้ตอบแบบประเมิน (Respondent Status)"})}),o.respondent_type?.map(r=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:r.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(r.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:t(Number(r.percentage||0).toFixed(1))})]},r.key))]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:t(l.section_4_2||`โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${t(p)} คน คิดเป็นร้อยละ 100.0 ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`)})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:t(l.section_4_3||`ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${a.title}" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${s?.overallLevel||"มากที่สุด"} (X̄ = ${t(Number(s?.overallMean||0).toFixed(2))}, S.D. = ${t(Number(s?.overallSd||0).toFixed(2))}) ดังแสดงในตารางที่ 4.1`)}),h.length>0&&e.jsxs("div",{className:"my-4",children:[e.jsx("p",{className:"text-center font-bold text-xs mb-2",children:"ตารางที่ 4.1 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน 4 ด้าน)"}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-10",children:"ที่"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left",children:"รายการประเมิน"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"ค่าเฉลี่ย (x̄)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"S.D."}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-28",children:"ระดับความพึงพอใจ"})]})}),e.jsxs("tbody",{children:[[1,2,3,4].map(r=>{const x=h.filter(i=>i.dimension===r),n=f?.[r];return x.length===0?null:e.jsxs(w.Fragment,{children:[e.jsx("tr",{className:"bg-slate-100/70 font-bold border border-slate-800",children:e.jsx("td",{colSpan:5,className:"py-1 px-3 border border-slate-800",children:n?.title?t(n.title):`ด้านที่ ${r}`})}),x.map((i,b)=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:t(i.id||b+1)}),e.jsx("td",{className:"py-1 px-3 pl-6 border border-slate-800",children:t(i.question)}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:t(Number(i.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:t(Number(i.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:i.level||"มากที่สุด"})]},i.id||b)),n&&e.jsxs("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:[e.jsxs("td",{colSpan:2,className:"py-1 px-3 text-right italic border border-slate-800",children:["รวมเฉลี่ยด้านที่ ",r]}),e.jsx("td",{className:"py-1 px-2 text-center font-bold border border-slate-800",children:t(Number(n.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:t(Number(n.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800 font-bold",children:n.level})]})]},r)}),e.jsxs("tr",{className:"bg-slate-200 font-bold border-t-2 border-slate-800",children:[e.jsx("td",{colSpan:2,className:"py-1.5 px-3 text-right border border-slate-800",children:"รวมเฉลี่ยภาพรวมทั้งโครงการ"}),e.jsx("td",{className:"py-1.5 px-2 text-center font-bold border border-slate-800",children:t(Number(s?.overallMean||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:t(Number(s?.overallSd||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-3 text-center font-bold border border-slate-800",children:s?.overallLevel||"มากที่สุด"})]})]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:t(l.section_4_4||`โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${t(a.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`)})]}),c&&e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.5 การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ 1"}),e.jsxs("div",{className:"thai-content space-y-2",children:[e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"1) ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:"})," ",t(c.objectiveFulfillment?.summary)]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"2) ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:"})," ",t(c.benefitRealization?.summary)]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"3) ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):"})," ",t(c.kpiAchievement?.summary)]})]})]})]})]})}export{z as default};

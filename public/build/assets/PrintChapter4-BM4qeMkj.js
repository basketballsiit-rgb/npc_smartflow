import{r as f,j as e,H as y,L as u,R as w}from"./app-DWUhBH3U.js";function z({project:n,survey:v,surveyStats:s}){const[h,g]=f.useState("normal"),d=n?.chapter_4_sections||{};n?.chapter_4_content;const r=t=>{if(t==null)return"";const p=["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"];return String(t).replace(/[0-9]/g,l=>p[parseInt(l,10)])},N=()=>{window.print()},o={compact:{docSize:"14px",lineHeight:"1.45",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.5",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.55",titleSize:"22px",headingSize:"17.5px"}}[h],m=s?.questionsStats||[],j=s?.dimensionStats||{},c=s?.demographicStats||{},x=s?.chapter1Comparison||null,i=s?.totalResponses||0;return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(y,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ ๔ - ${n.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
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
            `}),e.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(u,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),e.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ ๔: ผลการดำเนินงานโครงการ"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(t=>e.jsx("button",{type:"button",onClick:()=>g(t),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${h===t?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:t==="compact"?"ก เล็ก":t==="normal"?"ก ปานกลาง":"ก ใหญ่"},t))}),e.jsxs("button",{type:"button",onClick:N,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2",children:[e.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h1",{className:"print-title mb-2",children:"บทที่ ๔"}),e.jsx("h2",{className:"print-heading",children:"ผลการดำเนินงานโครงการ"})]}),e.jsxs("div",{className:"thai-content thai-indent mb-6",children:['การดำเนินงานโครงการ "',n.title,'" ประจำปีการศึกษา ',r(n.academic_year)," ของ",n.location||"วิทยาลัยสารพัดช่างน่าน"," ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้"]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"๔.๑ ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:d.section_4_1||`การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${n.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${r(i)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ ๔.๐`}),i>0&&c&&e.jsxs("div",{className:"my-4",children:[e.jsxs("p",{className:"text-center font-bold text-xs mb-2",children:["ตารางที่ ๔.๐ จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = ",r(i),")"]}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left w-1/2",children:"ข้อมูลทั่วไป (Demographic Profile)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"จำนวน (คน)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"ร้อยละ (%)"})]})}),e.jsxs("tbody",{children:[e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"๑. เพศ (Gender)"})}),c.gender?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"๒. ระดับการศึกษา (Education Level)"})}),c.education_level?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"๓. สถานะของผู้ตอบแบบประเมิน (Respondent Status)"})}),c.respondent_type?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key))]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"๔.๒ ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:d.section_4_2||`โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ ๑ โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${r(i)} คน คิดเป็นร้อยละ ๑๐๐.๐ ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"๔.๓ ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:d.section_4_3||`ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${n.title}" จำแนกตามกรอบการประเมิน ๔ ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${s?.overallLevel||"มากที่สุด"} (X̄ = ${r(Number(s?.overallMean||0).toFixed(2))}, S.D. = ${r(Number(s?.overallSd||0).toFixed(2))}) ดังแสดงในตารางที่ ๔.๑`}),m.length>0&&e.jsxs("div",{className:"my-4",children:[e.jsx("p",{className:"text-center font-bold text-xs mb-2",children:"ตารางที่ ๔.๑ ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน ๔ ด้าน)"}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-10",children:"ที่"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left",children:"รายการประเมิน"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-12",children:"N"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-14",children:"ค่าเฉลี่ย (x̄)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-14",children:"S.D."}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-14",children:"ร้อยละ"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-24",children:"ระดับความพึงพอใจ"})]})}),e.jsxs("tbody",{children:[[1,2,3,4].map(t=>{const p=m.filter(a=>a.dimension===t),l=j?.[t];return p.length===0?null:e.jsxs(w.Fragment,{children:[e.jsx("tr",{className:"bg-slate-100/70 font-bold border border-slate-800",children:e.jsx("td",{colSpan:7,className:"py-1 px-3 border border-slate-800",children:l?.title||`ด้านที่ ${r(t)}`})}),p.map((a,b)=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:r(a.id||b+1)}),e.jsx("td",{className:"py-1 px-3 pl-6 border border-slate-800",children:a.question}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(a.count||i)}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:r(Number(a.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(a.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(a.percentage||0).toFixed(1))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:a.level||"มากที่สุด"})]},a.id||b)),l&&e.jsxs("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:[e.jsxs("td",{colSpan:2,className:"py-1 px-3 text-right italic border border-slate-800",children:["รวมเฉลี่ยด้านที่ ",r(t)]}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(i)}),e.jsx("td",{className:"py-1 px-2 text-center font-bold border border-slate-800",children:r(Number(l.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(l.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(l.percentage||0).toFixed(1))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800 font-bold",children:l.level})]})]},t)}),e.jsxs("tr",{className:"bg-slate-200 font-bold border-t-2 border-slate-800",children:[e.jsx("td",{colSpan:2,className:"py-1.5 px-3 text-right border border-slate-800",children:"รวมเฉลี่ยภาพรวมทั้งโครงการ"}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:r(i)}),e.jsx("td",{className:"py-1.5 px-2 text-center font-bold border border-slate-800",children:r(Number(s?.overallMean||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:r(Number(s?.overallSd||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:r(Number(s?.overallPercentage||0).toFixed(1))}),e.jsx("td",{className:"py-1.5 px-3 text-center font-bold border border-slate-800",children:s?.overallLevel||"มากที่สุด"})]})]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"๔.๔ ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:d.section_4_4||`โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${r(n.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. ๒๕๖๐ อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`})]}),x&&e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"๔.๕ การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ ๑"}),e.jsxs("div",{className:"thai-content space-y-2",children:[e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"๑) ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:"})," ",x.objectiveFulfillment?.summary]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"๒) ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:"})," ",x.benefitRealization?.summary]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"๓) ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):"})," ",x.kpiAchievement?.summary]})]})]})]})]})}export{z as default};

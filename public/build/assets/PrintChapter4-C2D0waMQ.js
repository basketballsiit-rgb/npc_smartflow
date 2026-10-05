import{r as v,j as e,H as z,L as _,R as $}from"./app-DIjGn7qZ.js";function R({project:i,survey:k,surveyStats:a}){const[b,j]=v.useState("normal"),d=i?.chapter_4_sections||{};i?.chapter_4_content;const r=t=>{if(t==null)return"";const o={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(t).replace(/[๐-๙]/g,n=>o[n]||n)},N=()=>{window.print()},c={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[b],u=(t="รายงานผลโครงการ_บทที่_4")=>{const o=document.querySelector(".print-doc-container");if(!o)return;const n=o.cloneNode(!0);n.querySelectorAll(".no-print").forEach(S=>S.remove());const s=(t||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),h=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${s}</title>
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
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-top: 12pt;
                        margin-bottom: 12pt;
                        font-size: 14pt;
                    }
                    th, td {
                        border: 1px solid #333333;
                        padding: 5pt;
                        vertical-align: top;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="Section1">
                    ${n.innerHTML}
                </div>
            </body>
            </html>
        `,w=new Blob(["\uFEFF",h],{type:"application/msword;charset=utf-8"}),f=URL.createObjectURL(w),l=document.createElement("a");l.href=f,l.download=`${s}.doc`,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(f)},g=a?.questionsStats||[],y=a?.dimensionStats||{},p=a?.demographicStats||{},m=a?.chapter1Comparison||null,x=a?.totalResponses||0;return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(z,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ 4 - ${i.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${c.docSize};
                    --doc-line-height: ${c.lineHeight};
                    --title-font-size: ${c.titleSize};
                    --heading-font-size: ${c.headingSize};
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
            `}),e.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(_,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),e.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 4: ผลการดำเนินงานโครงการ"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(t=>e.jsx("button",{type:"button",onClick:()=>j(t),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${b===t?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:t==="compact"?"ก เล็ก":t==="normal"?"ก ปานกลาง":"ก ใหญ่"},t))}),e.jsxs("button",{type:"button",onClick:()=>u(`รายงานผลโครงการ_บทที่_4_${i.title||""}`),className:"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 4 เป็นไฟล์ Microsoft Word (.doc)",children:[e.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),e.jsxs("button",{type:"button",onClick:N,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[e.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h1",{className:"print-title mb-2",children:"บทที่ 4"}),e.jsx("h2",{className:"print-heading",children:"ผลการดำเนินงานโครงการ"})]}),e.jsx("div",{className:"thai-content thai-indent mb-6",children:r(`การดำเนินงานโครงการ "${i.title}" ประจำปีการศึกษา ${r(i.academic_year)} ของ${i.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้`)}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:r(d.section_4_1||`การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${i.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${r(x)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ 4.0`)}),x>0&&p&&e.jsxs("div",{className:"my-4",children:[e.jsxs("p",{className:"text-center font-bold text-xs mb-2",children:["ตารางที่ 4.0 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = ",r(x),")"]}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left w-1/2",children:"ข้อมูลทั่วไป (Demographic Profile)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"จำนวน (คน)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"ร้อยละ (%)"})]})}),e.jsxs("tbody",{children:[e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"1. เพศ (Gender)"})}),p.gender?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"2. ระดับการศึกษา (Education Level)"})}),p.education_level?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"3. สถานะของผู้ตอบแบบประเมิน (Respondent Status)"})}),p.respondent_type?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:r(Number(t.percentage||0).toFixed(1))})]},t.key))]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:r(d.section_4_2||`โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${r(x)} คน คิดเป็นร้อยละ 100.0 ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`)})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:r(d.section_4_3||`ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${i.title}" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${a?.overallLevel||"มากที่สุด"} (X̄ = ${r(Number(a?.overallMean||0).toFixed(2))}, S.D. = ${r(Number(a?.overallSd||0).toFixed(2))}) ดังแสดงในตารางที่ 4.1`)}),g.length>0&&e.jsxs("div",{className:"my-4",children:[e.jsx("p",{className:"text-center font-bold text-xs mb-2",children:"ตารางที่ 4.1 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน 4 ด้าน)"}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-10",children:"ที่"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left",children:"รายการประเมิน"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"ค่าเฉลี่ย (x̄)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"S.D."}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-28",children:"ระดับความพึงพอใจ"})]})}),e.jsxs("tbody",{children:[[1,2,3,4].map(t=>{const o=g.filter(s=>s.dimension===t),n=y?.[t];return o.length===0?null:e.jsxs($.Fragment,{children:[e.jsx("tr",{className:"bg-slate-100/70 font-bold border border-slate-800",children:e.jsx("td",{colSpan:5,className:"py-1 px-3 border border-slate-800",children:n?.title?r(n.title):`ด้านที่ ${t}`})}),o.map((s,h)=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:r(s.id||h+1)}),e.jsx("td",{className:"py-1 px-3 pl-6 border border-slate-800",children:r(s.question)}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:r(Number(s.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(s.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s.level||"มากที่สุด"})]},s.id||h)),n&&e.jsxs("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:[e.jsxs("td",{colSpan:2,className:"py-1 px-3 text-right italic border border-slate-800",children:["รวมเฉลี่ยด้านที่ ",t]}),e.jsx("td",{className:"py-1 px-2 text-center font-bold border border-slate-800",children:r(Number(n.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:r(Number(n.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800 font-bold",children:n.level})]})]},t)}),e.jsxs("tr",{className:"bg-slate-200 font-bold border-t-2 border-slate-800",children:[e.jsx("td",{colSpan:2,className:"py-1.5 px-3 text-right border border-slate-800",children:"รวมเฉลี่ยภาพรวมทั้งโครงการ"}),e.jsx("td",{className:"py-1.5 px-2 text-center font-bold border border-slate-800",children:r(Number(a?.overallMean||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:r(Number(a?.overallSd||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-3 text-center font-bold border border-slate-800",children:a?.overallLevel||"มากที่สุด"})]})]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน"}),e.jsx("div",{className:"thai-content thai-indent whitespace-pre-line leading-relaxed",children:r(d.section_4_4||`โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${r(i.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`)})]}),m&&e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold",children:"4.5 การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ 1"}),e.jsxs("div",{className:"thai-content space-y-2",children:[e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"1) ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:"})," ",r(m.objectiveFulfillment?.summary)]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"2) ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:"})," ",r(m.benefitRealization?.summary)]}),e.jsxs("p",{className:"thai-indent",children:[e.jsx("strong",{children:"3) ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):"})," ",r(m.kpiAchievement?.summary)]})]})]})]})]})}export{R as default};

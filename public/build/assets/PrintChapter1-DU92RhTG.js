import{r as S,j as t,H as k,L as z}from"./app-DIjGn7qZ.js";function $({project:i}){const[l,p]=S.useState("normal"),r=i?.chapter_1_sections||{},m=i?.chapter_1_content||"",n=e=>{if(e==null)return"";const s={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(e).replace(/[๐-๙]/g,o=>s[o]||o)},a=(e,s="")=>{if(e==null)return s;if(typeof e=="string")return e;if(typeof e=="number")return String(e);if(typeof e=="object"){if(Array.isArray(e))return e.map(o=>a(o)).filter(Boolean).join(`
`)||s;if(e.text!==void 0||e.unit!==void 0)return[e.text,e.unit].filter(Boolean).join(" ")||s;if(e.description)return String(e.description);if(e.title)return String(e.title);if(e.name)return String(e.name);try{return JSON.stringify(e)}catch{return s}}return String(e)},w=()=>{window.print()},c={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[l],j=(e="รายงานผลโครงการ_บทที่_1")=>{const s=document.querySelector(".print-doc-container");if(!s)return;const o=s.cloneNode(!0);o.querySelectorAll(".no-print").forEach(v=>v.remove());const f=(e||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),y=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${f}</title>
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
                    h4 {
                        font-size: 16pt;
                        font-weight: bold;
                        margin-top: 8pt;
                        margin-bottom: 4pt;
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
        `,N=new Blob(["\uFEFF",y],{type:"application/msword;charset=utf-8"}),u=URL.createObjectURL(N),d=document.createElement("a");d.href=u,d.download=`${f}.doc`,document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(u)},h=Array.isArray(i.objectives)?i.objectives:i.objectives?[i.objectives]:[],x=Array.isArray(i.expected_benefits)?i.expected_benefits:i.expected_benefits?[i.expected_benefits]:[],g=Array.isArray(i.targets)?i.targets:i.targets?[i.targets]:[],b=Array.isArray(i.activities)?i.activities:[];return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(k,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 1 - ${i.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
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
            `}),t.jsxs("div",{className:"max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden font-sans",children:[t.jsxs("div",{children:[t.jsxs("h3",{className:"text-base md:text-lg font-bold text-slate-900 flex items-center gap-2",children:[t.jsx("span",{children:"📘"})," รายงานผลโครงการ: บทที่ 1 บทนำ (Introduction)"]}),t.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"ระยะขอบทุกด้าน 1 นิ้ว | ฟอนต์ TH Sarabun PSK ขนาดมาตรฐาน 1:1 กับรายงาน 5 บท"})]}),t.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold",children:[t.jsx("span",{className:"text-slate-500 px-1.5 text-[11px]",children:"ขนาดฟอนต์:"}),t.jsx("button",{type:"button",onClick:()=>p("compact"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="compact"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดกระทัดรัด (14px)",children:"กระทัดรัด"}),t.jsx("button",{type:"button",onClick:()=>p("normal"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="normal"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดมาตรฐาน (15px)",children:"ปกติ"}),t.jsx("button",{type:"button",onClick:()=>p("large"),className:`px-2.5 py-1 rounded-lg transition-all ${l==="large"?"bg-purple-600 text-white shadow-xs":"text-slate-700 hover:bg-slate-200"}`,title:"ขนาดตัวโต (16.5px)",children:"ตัวโต"})]}),t.jsx("a",{href:route("projects.print",i.id),target:"_blank",rel:"noopener noreferrer",className:"rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs",title:"ดูแบบเสนอโครงการฉบับเต็ม",children:"📄 แบบเสนอโครงการ"}),t.jsx(z,{href:route("projects.show",i.id),className:"rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs",children:"← กลับหน้าโครงการ"}),t.jsxs("button",{type:"button",onClick:()=>j(`รายงานผลโครงการ_บทที่_1_${i.title||""}`),className:"rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 1 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{onClick:w,className:"rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-800 hover:to-indigo-800 transition flex items-center gap-1.5 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," สั่งพิมพ์ / บันทึกเป็น PDF"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto bg-white shadow-md rounded-2xl print:p-0 print:m-0 print:shadow-none print:border-none print:rounded-none",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h2",{className:"print-title tracking-wide text-black mb-1",children:"บทที่ 1"}),t.jsx("h1",{className:"print-title tracking-wide text-black",children:"บทนำ"})]}),m?t.jsx("div",{className:"space-y-6 text-black whitespace-pre-wrap leading-relaxed text-justify",children:n(m)}):t.jsxs("div",{className:"space-y-6 text-black leading-relaxed",children:[t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.1 ความเป็นมาและความสำคัญของปัญหา"}),t.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap leading-relaxed",children:n(a(r.background)||a(i.background_rationale)||"ไม่ได้ระบุความเป็นมาและความสำคัญของปัญหา")})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.2 วัตถุประสงค์ของโครงการ"}),t.jsx("div",{className:"space-y-1.5",children:r.objectives?t.jsx("div",{className:"whitespace-pre-wrap thai-indent leading-relaxed",children:n(a(r.objectives))}):h.length>0?h.map((e,s)=>t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed",children:[t.jsxs("span",{className:"font-bold shrink-0 w-12 sm:w-14",children:["1.2.",n(s+1)]}),t.jsx("span",{className:"flex-1",children:n(a(e))})]},s)):t.jsx("div",{className:"thai-indent",children:"ไม่ได้ระบุวัตถุประสงค์โครงการ"})})]}),t.jsxs("div",{className:"print-break-inside-avoid space-y-3",children:[t.jsx("h3",{className:"print-heading text-black mb-1",children:"1.3 ขอบเขตของโครงการ"}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.1 ขอบเขตด้านประชากรและกลุ่มเป้าหมาย"}),t.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(a(r.scope_target)||(g.length>0?g.map(e=>a(e)).filter(Boolean).join(", "):"นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง"))})]}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.2 ขอบเขตด้านเนื้อหาและกิจกรรมการดำเนินงาน"}),t.jsx("div",{className:"thai-indent whitespace-pre-wrap",children:n(a(r.scope_content)||(b.length>0?b.map((e,s)=>`${n(s+1)}. ${a(e)}`).join(`
`):"ดำเนินงานตามกิจกรรมและขั้นตอนการดำเนินงานที่ระบุไว้ในแผนปฏิบัติการ"))})]}),t.jsxs("div",{className:"pl-4",children:[t.jsx("h4",{className:"font-bold text-black mb-1",children:"1.3.3 ขอบเขตด้านสถานที่และระยะเวลาดำเนินการ"}),t.jsx("div",{className:"thai-indent",children:n(a(r.scope_location_time)||`สถานที่ดำเนินโครงการ: ${i.location||"วิทยาลัยสารพัดช่างน่าน"} `+(i.start_date?`ระยะเวลาตั้งแต่วันที่ ${n(i.start_date)} ถึง ${n(i.end_date||i.start_date)}`:""))})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.4 ตัวชี้วัดและเป้าหมายความสำเร็จ"}),t.jsxs("div",{className:"space-y-2 pl-4",children:[t.jsxs("div",{children:[t.jsx("span",{className:"font-bold",children:"1.4.1 ตัวชี้วัดเชิงปริมาณ: "}),t.jsx("span",{children:n(a(r.indicators_quantitative)||a(i.indicators?.quantitative)||"ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมาย")})]}),t.jsxs("div",{children:[t.jsx("span",{className:"font-bold",children:"1.4.2 ตัวชี้วัดเชิงคุณภาพ: "}),t.jsx("span",{children:n(a(r.indicators_qualitative)||a(i.indicators?.qualitative)||"ผู้เข้าร่วมโครงการมีความพึงพอใจในระดับดีขึ้นไป (ค่าเฉลี่ย 3.51 ขึ้นไป)")})]})]})]}),t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.5 ประโยชน์ที่คาดว่าจะได้รับ"}),t.jsx("div",{className:"space-y-1.5",children:r.benefits||r.expected_benefits?t.jsx("div",{className:"whitespace-pre-wrap thai-indent leading-relaxed",children:n(a(r.benefits||r.expected_benefits))}):x.length>0?x.map((e,s)=>t.jsxs("div",{className:"flex items-start pl-6 sm:pl-8 my-1.5 text-justify leading-relaxed",children:[t.jsxs("span",{className:"font-bold shrink-0 w-12 sm:w-14",children:["1.5.",n(s+1)]}),t.jsx("span",{className:"flex-1",children:n(a(e))})]},s)):t.jsx("div",{className:"thai-indent",children:"การดำเนินงานบรรลุผลสำเร็จตามเป้าหมายและเกิดประโยชน์ต่อผู้เรียนและสถานศึกษา"})})]}),r.definitions&&t.jsxs("div",{className:"print-break-inside-avoid",children:[t.jsx("h3",{className:"print-heading text-black mb-2",children:"1.6 นิยามศัพท์เฉพาะ"}),t.jsx("div",{className:"text-justify thai-indent whitespace-pre-wrap",children:n(a(r.definitions))})]})]})]})]})}export{$ as default};

import{r as A,j as e,H as D,L as O,R as W}from"./app-DYV56U5J.js";function B({project:p,survey:I,surveyStats:c}){const[R,C]=A.useState("normal"),v=p?.chapter_4_sections||{};p?.chapter_4_content;const s=t=>{if(t==null)return"";const h={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(t).replace(/[๐-๙]/g,r=>h[r]||r)},E=()=>{window.print()},S={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[R],T=(t="รายงานผลโครงการ_บทที่_4")=>{const h=document.querySelector(".print-doc-container");if(!h)return;const r=h.cloneNode(!0);r.querySelectorAll(".no-print").forEach(y=>y.remove());const l=(t||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),g=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${l}</title>
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
                    ${r.innerHTML}
                </div>
            </body>
            </html>
        `,m=new Blob(["\uFEFF",g],{type:"application/msword;charset=utf-8"}),u=URL.createObjectURL(m),i=document.createElement("a");i.href=u,i.download=`${l}.doc`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(u)},H=c?.questionsStats||[],M=c?.dimensionStats||{},$=c?.demographicStats||{},f=c?.chapter1Comparison||null,z=c?.totalResponses||0,x=t=>t?t.split(/(\*\*[^*]+\*\*)/g).map((r,l)=>r.startsWith("**")&&r.endsWith("**")?e.jsx("strong",{className:"font-bold text-slate-900",children:r.slice(2,-2)},l):r):null,N=(t,h="")=>{if(!t)return null;let r=s(t);const l=new RegExp(`^(?:#*\\s*)?(?:${h}|4\\.[1-5])\\s*[^\\n]*\\n*`,"u");r=r.replace(l,"").trim();const g=r.split(/\r?\n/),m=[];let u=[];const i=y=>{if(u.length>0){const n=u.join(" ").trim();n&&m.push(e.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",children:x(n)},`p-${y}`)),u=[]}};return g.forEach((y,n)=>{const j=y.trim();if(!j){i(n);return}const k=j.match(/^(?:#*\s*)?(4\.\d+\.\d+)\s*(.*)$/u);if(k){i(n),m.push(e.jsxs("div",{className:"mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6",children:[e.jsxs("span",{children:[k[1]," "]}),e.jsx("span",{children:x(k[2])})]},`subsec-${n}`));return}const _=j.match(/^\(([0-9]+)\)\s*(.*)$/u);if(_){i(n);const d=_[1],a=_[2],o=a.indexOf(":");let b="",w=a;o!==-1&&o<80&&(b=a.slice(0,o+1),w=a.slice(o+1).trim()),m.push(e.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 text-justify leading-relaxed",children:[e.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",children:["(",d,")"]}),e.jsxs("div",{className:"flex-1 text-slate-800",children:[b&&e.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:b}),e.jsx("span",{children:x(w)})]})]},`subnum-${n}`));return}const L=j.match(/^[-•]\s*(.*)$/u);if(L){i(n);const d=L[1],a=d.indexOf(":");let o="",b=d;a!==-1&&a<60&&(o=d.slice(0,a+1),b=d.slice(a+1).trim()),m.push(e.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 text-justify leading-relaxed",children:[e.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",children:"-"}),e.jsxs("div",{className:"flex-1 text-slate-800",children:[o&&e.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:o}),e.jsx("span",{children:x(b)})]})]},`bullet-${n}`));return}const F=j.match(/^(\d+)\.\s+(.+)$/u);if(F){i(n);const d=F[1],a=F[2];m.push(e.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[e.jsxs("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:[d,"."]}),e.jsx("span",{className:"flex-1 text-slate-800",children:x(a)})]},`num-${n}`));return}const P=j.match(/^(\d+\))\s*(.+)$/u);if(P){i(n);const d=P[1],a=P[2],o=a.indexOf(":");if(o!==-1&&o<80){const b=a.slice(0,o+1),w=a.slice(o+1).trim();w?m.push(e.jsxs("div",{className:"mt-3.5 mb-2 pl-4 sm:pl-6 text-justify leading-relaxed",children:[e.jsxs("span",{className:"font-bold text-slate-900",children:[d," ",b," "]}),e.jsx("span",{className:"text-slate-800",children:x(w)})]},`itemp-${n}`)):m.push(e.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900",children:e.jsxs("span",{children:[d," ",b]})},`itemp-${n}`))}else m.push(e.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[e.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:d}),e.jsx("span",{className:"flex-1 text-slate-800",children:x(a)})]},`itemp-${n}`));return}u.push(j)}),i(g.length),e.jsx("div",{className:"space-y-1",children:m})};return e.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[e.jsxs(D,{children:[e.jsx("title",{children:`รายงานผลโครงการ บทที่ 4 - ${p.title}`}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${S.docSize};
                    --doc-line-height: ${S.lineHeight};
                    --title-font-size: ${S.titleSize};
                    --heading-font-size: ${S.headingSize};
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
            `}),e.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(O,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),e.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 4: ผลการดำเนินงานโครงการ"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(t=>e.jsx("button",{type:"button",onClick:()=>C(t),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${R===t?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:t==="compact"?"ก เล็ก":t==="normal"?"ก ปานกลาง":"ก ใหญ่"},t))}),e.jsxs("button",{type:"button",onClick:()=>T(`รายงานผลโครงการ_บทที่_4_${p.title||""}`),className:"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 4 เป็นไฟล์ Microsoft Word (.doc)",children:[e.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),e.jsxs("button",{type:"button",onClick:E,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[e.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),e.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h1",{className:"print-title mb-2",children:"บทที่ 4"}),e.jsx("h2",{className:"print-heading",children:"ผลการดำเนินงานโครงการ"})]}),e.jsx("div",{className:"mb-6",children:N(`การดำเนินงานโครงการ "${p.title}" ประจำปีการศึกษา ${s(p.academic_year)} ของ${p.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้`)}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน"}),N(v.section_4_1||`การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${p.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${s(z)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ 4.0`,"4\\.1"),z>0&&$&&e.jsxs("div",{className:"my-4",children:[e.jsxs("p",{className:"text-center font-bold text-xs mb-2",children:["ตารางที่ 4.0 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = ",s(z),")"]}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left w-1/2",children:"ข้อมูลทั่วไป (Demographic Profile)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"จำนวน (คน)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"ร้อยละ (%)"})]})}),e.jsxs("tbody",{children:[e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"1. เพศ (Gender)"})}),$.gender?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"2. ระดับการศึกษา (Education Level)"})}),$.education_level?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(t.percentage||0).toFixed(1))})]},t.key)),e.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:e.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"3. สถานะของผู้ตอบแบบประเมิน (Respondent Status)"})}),$.respondent_type?.map(t=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:t.label}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(t.count)}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(t.percentage||0).toFixed(1))})]},t.key))]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ"}),N(v.section_4_2||`โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${s(z)} คน คิดเป็นร้อยละ 100.0 ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`,"4\\.2")]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ"}),N(v.section_4_3||`ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${p.title}" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${c?.overallLevel||"มากที่สุด"} (X̄ = ${s(Number(c?.overallMean||0).toFixed(2))}, S.D. = ${s(Number(c?.overallSd||0).toFixed(2))}) ดังแสดงในตารางที่ 4.1`,"4\\.3"),H.length>0&&e.jsxs("div",{className:"my-4",children:[e.jsx("p",{className:"text-center font-bold text-xs mb-2",children:"ตารางที่ 4.1 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน 4 ด้าน)"}),e.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-10",children:"ที่"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left",children:"รายการประเมิน"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"ค่าเฉลี่ย (x̄)"}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"S.D."}),e.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-28",children:"ระดับความพึงพอใจ"})]})}),e.jsxs("tbody",{children:[[1,2,3,4].map(t=>{const h=H.filter(l=>l.dimension===t),r=M?.[t];return h.length===0?null:e.jsxs(W.Fragment,{children:[e.jsx("tr",{className:"bg-slate-100/70 font-bold border border-slate-800",children:e.jsx("td",{colSpan:5,className:"py-1 px-3 border border-slate-800",children:r?.title?s(r.title):`ด้านที่ ${t}`})}),h.map((l,g)=>e.jsxs("tr",{className:"border border-slate-800",children:[e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:s(l.id||g+1)}),e.jsx("td",{className:"py-1 px-3 pl-6 border border-slate-800",children:s(l.question)}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:s(Number(l.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:s(Number(l.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:l.level||"มากที่สุด"})]},l.id||g)),r&&e.jsxs("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:[e.jsxs("td",{colSpan:2,className:"py-1 px-3 text-right italic border border-slate-800",children:["รวมเฉลี่ยด้านที่ ",t]}),e.jsx("td",{className:"py-1 px-2 text-center font-bold border border-slate-800",children:s(Number(r.mean||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:s(Number(r.sd||0).toFixed(2))}),e.jsx("td",{className:"py-1 px-3 text-center border border-slate-800 font-bold",children:r.level})]})]},t)}),e.jsxs("tr",{className:"bg-slate-200 font-bold border-t-2 border-slate-800",children:[e.jsx("td",{colSpan:2,className:"py-1.5 px-3 text-right border border-slate-800",children:"รวมเฉลี่ยภาพรวมทั้งโครงการ"}),e.jsx("td",{className:"py-1.5 px-2 text-center font-bold border border-slate-800",children:s(Number(c?.overallMean||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:s(Number(c?.overallSd||0).toFixed(2))}),e.jsx("td",{className:"py-1.5 px-3 text-center font-bold border border-slate-800",children:c?.overallLevel||"มากที่สุด"})]})]})]})]})]}),e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน"}),N(v.section_4_4||`โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${s(p.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`,"4\\.4")]}),f&&e.jsxs("div",{className:"mb-6 space-y-3",children:[e.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.5 การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ 1"}),e.jsxs("div",{className:"space-y-2",children:[f.objectiveFulfillment?.summary&&e.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[e.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"1)"}),e.jsxs("div",{className:"flex-1 text-slate-800",children:[e.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:"}),e.jsx("span",{children:x(s(f.objectiveFulfillment.summary))})]})]}),f.benefitRealization?.summary&&e.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[e.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"2)"}),e.jsxs("div",{className:"flex-1 text-slate-800",children:[e.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:"}),e.jsx("span",{children:x(s(f.benefitRealization.summary))})]})]}),f.kpiAchievement?.summary&&e.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[e.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"3)"}),e.jsxs("div",{className:"flex-1 text-slate-800",children:[e.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):"}),e.jsx("span",{children:x(s(f.kpiAchievement.summary))})]})]})]})]})]})]})}export{B as default};

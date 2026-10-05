import{r as M,j as t,H as W,L as D,R as O}from"./app-BDyD8t7Q.js";function B({project:p,survey:I,surveyStats:c}){const[R,C]=M.useState("normal"),k=p?.chapter_4_sections||{};p?.chapter_4_content;const s=e=>{if(e==null)return"";const b={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(e).replace(/[๐-๙]/g,l=>b[l]||l)},T=()=>{window.print()},F={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[R],H=(e="รายงานผลโครงการ_บทที่_4")=>{const b=document.querySelector(".print-doc-container");if(!b)return;const l=b.cloneNode(!0);l.querySelectorAll(".no-print").forEach(i=>i.remove()),l.querySelectorAll(".academic-subheading").forEach(i=>{i.setAttribute("align","left"),i.style.textAlign="left",i.style.textJustify="none"});const a=(e||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),j=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${a}</title>
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
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 14pt;
                        margin-bottom: 6pt;
                    }
                    .academic-subheading {
                        font-size: 16pt !important;
                        font-weight: bold !important;
                        text-align: left !important;
                        text-justify: none !important;
                        margin-top: 10pt;
                        margin-bottom: 3pt;
                        padding-left: 0.75cm;
                    }
                    .academic-subheading * {
                        text-align: left !important;
                        text-justify: none !important;
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
                    .text-left {
                        text-align: left !important;
                        text-justify: none !important;
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
                    ${l.innerHTML}
                </div>
            </body>
            </html>
        `,m=new Blob(["\uFEFF",j],{type:"application/msword;charset=utf-8"}),y=URL.createObjectURL(m),N=document.createElement("a");N.href=y,N.download=`${a}.doc`,document.body.appendChild(N),N.click(),document.body.removeChild(N),URL.revokeObjectURL(y)},L=c?.questionsStats||[],J=c?.dimensionStats||{},_=c?.demographicStats||{},u=c?.chapter1Comparison||null,P=c?.totalResponses||0,h=e=>e?e.split(/(\*\*[^*]+\*\*)/g).map((l,a)=>l.startsWith("**")&&l.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:l.slice(2,-2)},a):l):null,v=(e,b="")=>{if(!e)return null;let l=s(e);const a=new RegExp(`^(?:#*\\s*)?(?:${b}|4\\.[1-5])\\s*[^\\n]*\\n*`,"u");l=l.replace(a,"").trim();const j=l.split(/\r?\n/),m=[];let y=[];const N=w=>{let n="";for(let x=0;x<w.length;x++){const f=w[x].trim();if(f)if(!n)n=f;else{const S=n.slice(-1),E=f.charAt(0),z=/[\u0E00-\u0E7F]/.test(S),$=/[\u0E00-\u0E7F]/.test(E);z&&$?n+=f:n+=" "+f}}return n},i=w=>{if(y.length>0){const n=N(y).trim();n&&m.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(n)},`p-${w}`)),y=[]}};return j.forEach((w,n)=>{const x=w.trim();if(!x){i(n);return}const f=x.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);if(f){i(n),m.push(t.jsxs("div",{className:"academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start",style:{textAlign:"left",textJustify:"none"},children:[t.jsx("span",{className:"shrink-0 mr-2 font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:f[1]}),t.jsx("span",{className:"flex-1 text-left font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:h(f[2])})]},`subsec-${n}`));return}const S=x.match(/^\(([0-9]+)\)\s+(.*)$/u);if(S){i(n);const d=S[1],r=S[2],o=r.indexOf(":");let g="",A=r;o!==-1&&o<80&&(g=r.slice(0,o+1),A=r.slice(o+1).trim()),m.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",style:{textAlign:"left"},children:["(",d,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[g&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:g}),t.jsx("span",{children:h(A)})]})]},`subnum-${n}`));return}const E=x.match(/^[-•]\s+(.*)$/u);if(E){i(n);const d=E[1],r=d.indexOf(":");let o="",g=d;r!==-1&&r<60&&(o=d.slice(0,r+1),g=d.slice(r+1).trim()),m.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",style:{textAlign:"left"},children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[o&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:o}),t.jsx("span",{children:h(g)})]})]},`bullet-${n}`));return}const z=x.match(/^(\d+)\.\s+(.+)$/u);if(z){i(n);const d=z[1],r=z[2];m.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{minWidth:"24px",textAlign:"left"},children:[d,"."]}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(r)})]},`num-${n}`));return}const $=x.match(/^(\d+\))\s+(.+)$/u);if($){i(n);const d=$[1],r=$[2],o=r.indexOf(":");if(o!==-1&&o<80){const g=r.slice(0,o+1),A=r.slice(o+1).trim();A?m.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:d}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:g}),t.jsx("span",{children:h(A)})]})]},`itemp-${n}`)):m.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left",style:{textAlign:"left",textJustify:"auto"},children:t.jsxs("span",{children:[d," ",g]})},`itemp-${n}`))}else m.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:d}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(r)})]},`itemp-${n}`));return}y.push(x)}),i(j.length),t.jsx("div",{className:"space-y-1",children:m})};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(W,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 4 - ${p.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${F.docSize};
                    --doc-line-height: ${F.lineHeight};
                    --title-font-size: ${F.titleSize};
                    --heading-font-size: ${F.headingSize};
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
                    text-align: center !important;
                }

                .print-heading {
                    font-size: var(--heading-font-size) !important;
                    font-weight: bold !important;
                    line-height: 1.4 !important;
                    text-align: left !important;
                    text-justify: none !important;
                }

                .academic-subheading {
                    text-align: left !important;
                    text-justify: none !important;
                    font-weight: bold !important;
                }

                .academic-subheading * {
                    text-align: left !important;
                    text-justify: none !important;
                }

                h1, h2, h3, h4 {
                    text-align: left !important;
                    text-justify: none !important;
                }

                .print-title {
                    text-align: center !important;
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
            `}),t.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx(D,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),t.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 4: ผลการดำเนินงานโครงการ"})]}),t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(e=>t.jsx("button",{type:"button",onClick:()=>C(e),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${R===e?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:e==="compact"?"ก เล็ก":e==="normal"?"ก ปานกลาง":"ก ใหญ่"},e))}),t.jsxs("button",{type:"button",onClick:()=>H(`รายงานผลโครงการ_บทที่_4_${p.title||""}`),className:"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 4 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{type:"button",onClick:T,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h1",{className:"print-title mb-2",children:"บทที่ 4"}),t.jsx("h2",{className:"print-title font-bold",children:"ผลการดำเนินงานโครงการ"})]}),t.jsx("div",{className:"mb-6",children:v(`การดำเนินงานโครงการ "${p.title}" ประจำปีการศึกษา ${s(p.academic_year)} ของ${p.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นเรียบร้อยตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะทำงานขอเสนอรายงานผลการวิเคราะห์ข้อมูลและผลสัมฤทธิ์ของการดำเนินโครงการตามวงจรบริหารงานคุณภาพ PDCA ดังมีรายละเอียดตามลำดับต่อไปนี้`)}),t.jsxs("div",{className:"mb-6 space-y-3",children:[t.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน"}),v(k.section_4_1||`การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ "${p.title}" ได้ดำเนินการรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน ${s(P)} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังแสดงในตารางที่ 4.0`,"4\\.1"),P>0&&_&&t.jsxs("div",{className:"my-4",children:[t.jsxs("p",{className:"text-center font-bold text-xs mb-2",children:["ตารางที่ 4.0 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน (N = ",s(P),")"]}),t.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[t.jsx("thead",{children:t.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[t.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left w-1/2",children:"ข้อมูลทั่วไป (Demographic Profile)"}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"จำนวน (คน)"}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-1/4",children:"ร้อยละ (%)"})]})}),t.jsxs("tbody",{children:[t.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:t.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"1. เพศ (Gender)"})}),_.gender?.map(e=>t.jsxs("tr",{className:"border border-slate-800",children:[t.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:e.label}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(e.count)}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(e.percentage||0).toFixed(1))})]},e.key)),t.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:t.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"2. ระดับการศึกษา (Education Level)"})}),_.education_level?.map(e=>t.jsxs("tr",{className:"border border-slate-800",children:[t.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:e.label}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(e.count)}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(e.percentage||0).toFixed(1))})]},e.key)),t.jsx("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:t.jsx("td",{colSpan:3,className:"py-1 px-3 border border-slate-800",children:"3. สถานะของผู้ตอบแบบประเมิน (Respondent Status)"})}),_.respondent_type?.map(e=>t.jsxs("tr",{className:"border border-slate-800",children:[t.jsx("td",{className:"py-1 px-3 pl-8 border border-slate-800",children:e.label}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(e.count)}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:s(Number(e.percentage||0).toFixed(1))})]},e.key))]})]})]})]}),t.jsxs("div",{className:"mb-6 space-y-3",children:[t.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ"}),v(k.section_4_2||`โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่าที่กำหนด จากผลการดำเนินงานปรากฏว่ามีผู้เข้าร่วมกิจกรรมทั้งสิ้น ${s(P)} คน คิดเป็นร้อยละ 100.0 ซึ่งถือว่าบรรลุเป้าหมายเชิงปริมาณตามแผนงานที่กำหนดไว้อย่างครบถ้วน`,"4\\.2")]}),t.jsxs("div",{className:"mb-6 space-y-3",children:[t.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ"}),v(k.section_4_3||`ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ "${p.title}" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ${c?.overallLevel||"มากที่สุด"} (X̄ = ${s(Number(c?.overallMean||0).toFixed(2))}, S.D. = ${s(Number(c?.overallSd||0).toFixed(2))}) ดังแสดงในตารางที่ 4.1`,"4\\.3"),L.length>0&&t.jsxs("div",{className:"my-4",children:[t.jsx("p",{className:"text-center font-bold text-xs mb-2",children:"ตารางที่ 4.1 ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และระดับความพึงพอใจต่อการดำเนินโครงการ (จำแนกรายด้าน 4 ด้าน)"}),t.jsxs("table",{className:"w-full text-xs border-collapse border border-slate-800",children:[t.jsx("thead",{children:t.jsxs("tr",{className:"bg-slate-100 text-slate-900 border-b border-slate-800 font-bold",children:[t.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-10",children:"ที่"}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-left",children:"รายการประเมิน"}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"ค่าเฉลี่ย (x̄)"}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-2 text-center w-16",children:"S.D."}),t.jsx("th",{className:"border border-slate-800 py-1.5 px-3 text-center w-28",children:"ระดับความพึงพอใจ"})]})}),t.jsxs("tbody",{children:[[1,2,3,4].map(e=>{const b=L.filter(a=>a.dimension===e),l=J?.[e];return b.length===0?null:t.jsxs(O.Fragment,{children:[t.jsx("tr",{className:"bg-slate-100/70 font-bold border border-slate-800",children:t.jsx("td",{colSpan:5,className:"py-1 px-3 border border-slate-800",children:l?.title?s(l.title):`ด้านที่ ${e}`})}),b.map((a,j)=>t.jsxs("tr",{className:"border border-slate-800",children:[t.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:s(a.id||j+1)}),t.jsx("td",{className:"py-1 px-3 pl-6 border border-slate-800",children:s(a.question)}),t.jsx("td",{className:"py-1 px-2 text-center border border-slate-800 font-bold",children:s(Number(a.mean||0).toFixed(2))}),t.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:s(Number(a.sd||0).toFixed(2))}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800",children:a.level||"มากที่สุด"})]},a.id||j)),l&&t.jsxs("tr",{className:"bg-slate-50 font-bold border border-slate-800",children:[t.jsxs("td",{colSpan:2,className:"py-1 px-3 text-right italic border border-slate-800",children:["รวมเฉลี่ยด้านที่ ",e]}),t.jsx("td",{className:"py-1 px-2 text-center font-bold border border-slate-800",children:s(Number(l.mean||0).toFixed(2))}),t.jsx("td",{className:"py-1 px-2 text-center border border-slate-800",children:s(Number(l.sd||0).toFixed(2))}),t.jsx("td",{className:"py-1 px-3 text-center border border-slate-800 font-bold",children:l.level})]})]},e)}),t.jsxs("tr",{className:"bg-slate-200 font-bold border-t-2 border-slate-800",children:[t.jsx("td",{colSpan:2,className:"py-1.5 px-3 text-right border border-slate-800",children:"รวมเฉลี่ยภาพรวมทั้งโครงการ"}),t.jsx("td",{className:"py-1.5 px-2 text-center font-bold border border-slate-800",children:s(Number(c?.overallMean||0).toFixed(2))}),t.jsx("td",{className:"py-1.5 px-2 text-center border border-slate-800",children:s(Number(c?.overallSd||0).toFixed(2))}),t.jsx("td",{className:"py-1.5 px-3 text-center font-bold border border-slate-800",children:c?.overallLevel||"มากที่สุด"})]})]})]})]})]}),t.jsxs("div",{className:"mb-6 space-y-3",children:[t.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน"}),v(k.section_4_4||`โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. ${s(p.academic_year)} การเบิกจ่ายงบประมาณเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 อย่างถูกต้อง โปร่งใส ประหยัด และเกิดความคุ้มค่าสูงสุด`,"4\\.4")]}),u&&t.jsxs("div",{className:"mb-6 space-y-3",children:[t.jsx("h3",{className:"print-heading font-bold mb-2",children:"4.5 การสังเคราะห์ผลการประเมินเปรียบเทียบกับเป้าหมายตามบทที่ 1"}),t.jsxs("div",{className:"space-y-2",children:[u.objectiveFulfillment?.summary&&t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[t.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"1)"}),t.jsxs("div",{className:"flex-1 text-slate-800",children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์วัตถุประสงค์ของโครงการ:"}),t.jsx("span",{children:h(s(u.objectiveFulfillment.summary))})]})]}),u.benefitRealization?.summary&&t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[t.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"2)"}),t.jsxs("div",{className:"flex-1 text-slate-800",children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์ประโยชน์ที่คาดว่าจะได้รับ:"}),t.jsx("span",{children:h(s(u.benefitRealization.summary))})]})]}),u.kpiAchievement?.summary&&t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[t.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:"3)"}),t.jsxs("div",{className:"flex-1 text-slate-800",children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:"ด้านการตอบโจทย์ตัวชี้วัดความสำเร็จ (KPIs):"}),t.jsx("span",{children:h(s(u.kpiAchievement.summary))})]})]})]})]})]})]})}export{B as default};

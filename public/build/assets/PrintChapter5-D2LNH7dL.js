import{r as D,j as t,H,L}from"./app-B1bkDfS3.js";function M({project:d,survey:J,surveyStats:F}){const[P,_]=D.useState("normal"),y=d?.chapter_5_sections||{};d?.chapter_5_content;const k=i=>{if(i==null)return"";const m={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(i).replace(/[๐-๙]/g,e=>m[e]||e)},E=()=>{window.print()},A={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[P],h=i=>i?i.split(/(\*\*[^*]+\*\*)/g).map((e,u)=>e.startsWith("**")&&e.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:e.slice(2,-2)},u):e):null,j=(i,m="")=>{if(!i)return null;let e=k(i);const u=new RegExp(`^(?:#*\\s*)?(?:${m}|5\\.[1-4])\\s*[^\\n]*\\n*`,"u");e=e.replace(u,"").trim();const z=e.split(/\r?\n/),r=[];let f=[];const g=b=>{let n="";for(let c=0;c<b.length;c++){const p=b[c].trim();if(p)if(!n)n=p;else{const w=n.slice(-1),$=p.charAt(0),N=/[\u0E00-\u0E7F]/.test(w),v=/[\u0E00-\u0E7F]/.test($);N&&v?n+=p:n+=" "+p}}return n},a=b=>{if(f.length>0){const n=g(f).trim();n&&r.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(n)},`p-${b}`)),f=[]}};return z.forEach((b,n)=>{const c=b.trim();if(!c){a(n);return}const p=c.match(/^(?:#*\s*)?([1-5]\.\d+(?:\.\d+)+)\.?\s+(.*)$/u);if(p){a(n),r.push(t.jsxs("div",{className:"academic-subheading mt-4 mb-2 font-bold text-slate-900 pl-4 sm:pl-6 text-left flex items-start",style:{textAlign:"left",textJustify:"none"},children:[t.jsx("span",{className:"shrink-0 mr-2 font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:p[1]}),t.jsx("span",{className:"flex-1 text-left font-bold text-slate-900",style:{textAlign:"left",textJustify:"none"},children:h(p[2])})]},`subsec-${n}`));return}const w=c.match(/^\(([0-9]+)\)\s+(.*)$/u);if(w){a(n);const o=w[1],s=w[2],l=s.indexOf(":");let x="",S=s;l!==-1&&l<80&&(x=s.slice(0,l+1),S=s.slice(l+1).trim()),r.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",style:{textAlign:"left"},children:["(",o,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[x&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:h(S)})]})]},`subnum-${n}`));return}const $=c.match(/^[-•]\s+(.*)$/u);if($){a(n);const o=$[1],s=o.indexOf(":");let l="",x=o;s!==-1&&s<60&&(l=o.slice(0,s+1),x=o.slice(s+1).trim()),r.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",style:{textAlign:"left"},children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[l&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:l}),t.jsx("span",{children:h(x)})]})]},`bullet-${n}`));return}const N=c.match(/^(\d+)\.\s+(.+)$/u);if(N){a(n);const o=N[1],s=N[2];r.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsxs("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{minWidth:"24px",textAlign:"left"},children:[o,"."]}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(s)})]},`num-${n}`));return}const v=c.match(/^(\d+\))\s+(.+)$/u);if(v){a(n);const o=v[1],s=v[2],l=s.indexOf(":");if(l!==-1&&l<80){const x=s.slice(0,l+1),S=s.slice(l+1).trim();S?r.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-2 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:o}),t.jsxs("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:[t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:x}),t.jsx("span",{children:h(S)})]})]},`itemp-${n}`)):r.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900 text-left",style:{textAlign:"left",textJustify:"auto"},children:t.jsxs("span",{children:[o," ",x]})},`itemp-${n}`))}else r.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 leading-relaxed text-left",style:{textAlign:"left"},children:[t.jsx("span",{className:"shrink-0 font-bold text-slate-900 mr-2",style:{textAlign:"left"},children:o}),t.jsx("div",{className:"flex-1 text-slate-800 text-justify",style:{textAlign:"justify",textJustify:"inter-cluster"},children:h(s)})]},`itemp-${n}`));return}f.push(c)}),a(z.length),t.jsx("div",{className:"space-y-1",children:r})},C=()=>{const i=d.title||"โครงการ",m=/(น้ำดื่ม|ตู้น้ำ|กรองน้ำ|สุขาภิบาล|อนามัย|สุขภาพ|สุขภาวะ|กายภาพ)/.test(i);let e=`จากผลการดำเนินงานโครงการ "${i}" ตามที่ได้นำเสนอไว้ในบทที่ 4 สามารถนำผลสัมฤทธิ์ที่ได้มาดำเนินการวิเคราะห์ อภิปรายผล และเชื่อมโยงความสอดคล้องกับแนวคิด ทฤษฎี นโยบาย และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ตามประเด็นสำคัญได้ดังนี้

`;return e+=`1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ (Quantitative Analysis & Discussion):
`,e+="ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณในบทที่ 4 (ข้อ 4.2) ปรากฏว่า โครงการบรรลุผลสำเร็จตามเป้าหมายที่กำหนดไว้ร้อยละ 100 ของเป้าหมาย เมื่อนำผลเชิงปริมาณดังกล่าวมาวิเคราะห์เชิงลึก พบว่าการที่โครงการได้รับการตอบรับและความร่วมมือจากกลุ่มเป้าหมายอย่างครบถ้วน เกิดจากความสอดคล้องกับความต้องการจำเป็นของผู้เรียนและสถานศึกษา ",m?e+="ซึ่งสอดคล้องกับทฤษฎีลำดับขั้นความต้องการของมาสโลว์ (Maslow's Hierarchy of Needs : Physiological Needs) ในบทที่ 2 ที่ระบุว่าน้ำดื่มสะอาดเป็นความต้องการทางกายภาพขั้นพื้นฐานที่สุดของมนุษย์ การจัดหาน้ำดื่มสะอาดและถูกสุขลักษณะจึงตอบโจทย์การดำเนินชีวิตของนักเรียน นักศึกษา และบุคลากรโดยตรง ส่งผลให้มีผู้เข้ามาใช้บริการครบถ้วนตามเป้าหมาย ":e+="ซึ่งสอดคล้องกับทฤษฎีแรงจูงใจและการมีส่วนร่วมที่ระบุไว้ในบทที่ 2 ",e+=`นอกจากนี้ยังสะท้อนถึงประสิทธิภาพของกระบวนการวางแผนประชาสัมพันธ์เชิงรุกตามขั้นตอน Plan ในวงจร PDCA (Deming, 1986) และการกระจายตัวของกลุ่มผู้เข้าร่วมกิจกรรมอย่างครอบคลุมทุกกลุ่มเป้าหมายตามข้อมูลประชากรศาสตร์ในบทที่ 4 (ข้อ 4.1) สอดคล้องกับหลักการบริหารแบบมีส่วนร่วม (Participative Management)

`,e+=`2) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงคุณภาพ (Qualitative Analysis & Discussion):
`,e+="ผลการประเมินความพึงพอใจต่อการดำเนินโครงการในบทที่ 4 (ข้อ 4.3) มีค่าเฉลี่ยในภาพรวมและรายด้านทั้ง 4 ด้านอยู่ในระดับมากที่สุดตามเกณฑ์ของเบสท์ (Best, 1977) ",m?e+=`ซึ่งสอดคล้องกับทฤษฎีคุณภาพการบริการ (SERVQUAL: Parasuraman, Zeithaml, & Berry, 1988) ในบทที่ 2 ในมิติด้านกายภาพที่สัมผัสได้ (Tangibles) และความเชื่อถือได้ (Reliability) ของจุดบริการน้ำดื่ม และสอดคล้องอย่างยิ่งกับผลงานวิจัยของ สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565) และ ภัทรดนัย บุญเรือง (2566) ในบทที่ 2 ที่พบว่า การพัฒนาระบบน้ำดื่มสะอาดและการดูแลสุขาภิบาลในสถานศึกษาตามวงจร PDCA ส่งผลให้ผู้เรียนมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด และช่วยส่งเสริมสุขภาวะที่ดีอย่างมีนัยสำคัญทางสถิติ

`:e+=`ซึ่งสอดคล้องกับทฤษฎีการเรียนรู้เชิงประสบการณ์ของ Kolb (1984) และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ที่พบว่าการจัดกิจกรรมพัฒนาทักษะวิชาชีพตามวงจร PDCA ส่งผลให้ผู้เรียนมีสมรรถนะวิชาชีพและความพึงพอใจสูงขึ้นอย่างมีนัยสำคัญ

`,e+=`3) การอภิปรายผลด้านการบริหารงบประมาณและความคุ้มค่า (Budget Efficiency & Good Governance):
`,e+=`ผลสัมฤทธิ์การใช้จ่ายงบประมาณในบทที่ 4 (ข้อ 4.4) เป็นไปอย่างถูกต้อง โปร่งใส ประหยัด และคุ้มค่าตามหลักธรรมาภิบาลของการบริหารงานภาครัฐ

`,e+=`4) การอภิปรายความสอดคล้องต่อนโยบายจุดเน้น ยุทธศาสตร์ สอศ. และวงจร PDCA:
`,e+="การดำเนินโครงการสอดคล้องโดยตรงกับยุทธศาสตร์ของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในบทที่ 2 (ข้อ 2.2) ในการเสริมสร้างสุขภาวะ ความปลอดภัยของผู้เรียน และการพัฒนาสิ่งแวดล้อมสาธารณูปโภคเพื่อสนับสนุนการจัดการศึกษาตามวงจรบริหารงานคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) อย่างครบวงจร",e},T=(i="รายงานผลโครงการ_บทที่_5")=>{const m=document.querySelector(".print-doc-container");if(!m)return;const e=m.cloneNode(!0);e.querySelectorAll(".no-print").forEach(a=>a.remove()),e.querySelectorAll(".academic-subheading").forEach(a=>{a.setAttribute("align","left"),a.style.textAlign="left",a.style.textJustify="none"});const u=(i||"รายงานโครงการ").replace(/[\/\\?%*:|"<>]/g,"_"),z=`
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${u}</title>
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
                        padding: 6pt;
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
                    ${e.innerHTML}
                </div>
            </body>
            </html>
        `,r=new Blob(["\uFEFF",z],{type:"application/msword;charset=utf-8"}),f=URL.createObjectURL(r),g=document.createElement("a");g.href=f,g.download=`${u}.doc`,document.body.appendChild(g),g.click(),document.body.removeChild(g),URL.revokeObjectURL(f)};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(H,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 5 - ${d.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${A.docSize};
                    --doc-line-height: ${A.lineHeight};
                    --title-font-size: ${A.titleSize};
                    --heading-font-size: ${A.headingSize};
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
            `}),t.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx(L,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),t.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(i=>t.jsx("button",{type:"button",onClick:()=>_(i),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${P===i?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:i==="compact"?"ก เล็ก":i==="normal"?"ก ปานกลาง":"ก ใหญ่"},i))}),t.jsxs("button",{type:"button",onClick:()=>T(`รายงานผลโครงการ_บทที่_5_${d.title||""}`),className:"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer",title:"ดาวน์โหลดเนื้อหาบทที่ 5 เป็นไฟล์ Microsoft Word (.doc)",children:[t.jsx("span",{children:"📥"})," ดาวน์โหลด Word (.doc)"]}),t.jsxs("button",{type:"button",onClick:E,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h1",{className:"print-title mb-2",children:"บทที่ 5"}),t.jsx("h2",{className:"print-title font-bold",children:"สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsx("div",{className:"mb-6",children:j(y.intro||`การดำเนินงานโครงการ "${d.title}" ประจำปีการศึกษา ${k(d.academic_year)} ของ${d.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้`)}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.1 สรุปผลการดำเนินโครงการ"}),j(y.section_5_1||`การดำเนินงานโครงการ "${d.title}" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณได้อย่างครบถ้วนสมบูรณ์`,"5.1")]}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.2 การอภิปรายผลการดำเนินโครงการ"}),j(y.section_5_2||C(),"5.2")]}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.3 ปัญหา อุปสรรค และแนวทางแก้ไข"}),j(y.section_5_3||"จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขที่คณะผู้ดำเนินงานได้แก้ไขปัญหาอย่างมีประสิทธิภาพ","5.3")]}),t.jsxs("div",{className:"mb-8",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.4 ข้อเสนอแนะ"}),j(y.section_5_4||"ข้อเสนอแนะในการนำผลไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป","5.4")]})]})]})}export{M as default};

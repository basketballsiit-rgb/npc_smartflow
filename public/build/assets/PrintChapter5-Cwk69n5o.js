import{r as H,j as t,H as C,L as M}from"./app--5mtnKDU.js";function I({project:r,survey:E,surveyStats:T}){const[$,k]=H.useState("normal"),x=r?.chapter_5_sections||{};r?.chapter_5_content;const j=s=>{if(s==null)return"";const m={"๐":"0","๑":"1","๒":"2","๓":"3","๔":"4","๕":"5","๖":"6","๗":"7","๘":"8","๙":"9"};return String(s).replace(/[๐-๙]/g,e=>m[e]||e)},A=()=>{window.print()},u={compact:{docSize:"14px",lineHeight:"1.6",titleSize:"18px",headingSize:"15px"},normal:{docSize:"15px",lineHeight:"1.68",titleSize:"20px",headingSize:"16px"},large:{docSize:"16.5px",lineHeight:"1.75",titleSize:"22px",headingSize:"17.5px"}}[$],d=s=>s?s.split(/(\*\*[^*]+\*\*)/g).map((e,N)=>e.startsWith("**")&&e.endsWith("**")?t.jsx("strong",{className:"font-bold text-slate-900",children:e.slice(2,-2)},N):e):null,g=(s,m="")=>{if(!s)return null;let e=j(s);const N=new RegExp(`^(?:#*\\s*)?(?:${m}|5\\.[1-4])\\s*[^\\n]*\\n*`,"u");e=e.replace(N,"").trim();const P=e.split(/\r?\n/),o=[];let b=[];const p=y=>{if(b.length>0){const n=b.join(" ").trim();n&&o.push(t.jsx("p",{className:"thai-content thai-indent my-2.5 text-justify leading-relaxed",children:d(n)},`p-${y}`)),b=[]}};return P.forEach((y,n)=>{const h=y.trim();if(!h){p(n);return}const v=h.match(/^(?:#*\s*)?(5\.\d+\.\d+)\s*(.*)$/u);if(v){p(n),o.push(t.jsxs("div",{className:"mt-5 mb-2.5 font-bold text-slate-900 pl-4 sm:pl-6",children:[t.jsxs("span",{children:[v[1]," "]}),t.jsx("span",{children:d(v[2])})]},`subsec-${n}`));return}const w=h.match(/^\(([0-9]+)\)\s*(.*)$/u);if(w){p(n);const l=w[1],i=w[2],a=i.indexOf(":");let c="",f=i;a!==-1&&a<80&&(c=i.slice(0,a+1),f=i.slice(a+1).trim()),o.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-12 my-2 text-justify leading-relaxed",children:[t.jsxs("span",{className:"shrink-0 font-bold mr-2 text-slate-900",children:["(",l,")"]}),t.jsxs("div",{className:"flex-1 text-slate-800",children:[c&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:c}),t.jsx("span",{children:d(f)})]})]},`subnum-${n}`));return}const _=h.match(/^[-•]\s*(.*)$/u);if(_){p(n);const l=_[1],i=l.indexOf(":");let a="",c=l;i!==-1&&i<60&&(a=l.slice(0,i+1),c=l.slice(i+1).trim()),o.push(t.jsxs("div",{className:"flex items-start pl-10 sm:pl-14 my-1.5 text-justify leading-relaxed",children:[t.jsx("span",{className:"shrink-0 w-4 font-bold text-slate-700",children:"-"}),t.jsxs("div",{className:"flex-1 text-slate-800",children:[a&&t.jsx("strong",{className:"font-bold text-slate-900 mr-1",children:a}),t.jsx("span",{children:d(c)})]})]},`bullet-${n}`));return}const S=h.match(/^(\d+)\.\s+(.+)$/u);if(S){p(n);const l=S[1],i=S[2];o.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[t.jsxs("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:[l,"."]}),t.jsx("span",{className:"flex-1 text-slate-800",children:d(i)})]},`num-${n}`));return}const z=h.match(/^(\d+\))\s*(.+)$/u);if(z){p(n);const l=z[1],i=z[2],a=i.indexOf(":");if(a!==-1&&a<80){const c=i.slice(0,a+1),f=i.slice(a+1).trim();f?o.push(t.jsxs("div",{className:"mt-3.5 mb-2 pl-4 sm:pl-6 text-justify leading-relaxed",children:[t.jsxs("span",{className:"font-bold text-slate-900",children:[l," ",c," "]}),t.jsx("span",{className:"text-slate-800",children:d(f)})]},`itemp-${n}`)):o.push(t.jsx("div",{className:"mt-4 mb-2 pl-4 sm:pl-6 font-bold text-slate-900",children:t.jsxs("span",{children:[l," ",c]})},`itemp-${n}`))}else o.push(t.jsxs("div",{className:"flex items-start pl-8 sm:pl-10 my-1.5 text-justify leading-relaxed",children:[t.jsx("span",{className:"shrink-0 w-7 font-bold text-slate-900",children:l}),t.jsx("span",{className:"flex-1 text-slate-800",children:d(i)})]},`itemp-${n}`));return}b.push(h)}),p(P.length),t.jsx("div",{className:"space-y-1",children:o})},D=()=>{const s=r.title||"โครงการ",m=/(น้ำดื่ม|ตู้น้ำ|กรองน้ำ|สุขาภิบาล|อนามัย|สุขภาพ|สุขภาวะ|กายภาพ)/.test(s);let e=`จากผลการดำเนินงานโครงการ "${s}" ตามที่ได้นำเสนอไว้ในบทที่ 4 สามารถนำผลสัมฤทธิ์ที่ได้มาดำเนินการวิเคราะห์ อภิปรายผล และเชื่อมโยงความสอดคล้องกับแนวคิด ทฤษฎี นโยบาย และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ตามประเด็นสำคัญได้ดังนี้

`;return e+=`1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ (Quantitative Analysis & Discussion):
`,e+="ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณในบทที่ 4 (ข้อ 4.2) ปรากฏว่า โครงการบรรลุผลสำเร็จตามเป้าหมายที่กำหนดไว้ร้อยละ 100 ของเป้าหมาย เมื่อนำผลเชิงปริมาณดังกล่าวมาวิเคราะห์เชิงลึก พบว่าการที่โครงการได้รับการตอบรับและความร่วมมือจากกลุ่มเป้าหมายอย่างครบถ้วน เกิดจากความสอดคล้องกับความต้องการจำเป็นของผู้เรียนและสถานศึกษา ",m?e+="ซึ่งสอดคล้องกับทฤษฎีลำดับขั้นความต้องการของมาสโลว์ (Maslow's Hierarchy of Needs : Physiological Needs) ในบทที่ 2 ที่ระบุว่าน้ำดื่มสะอาดเป็นความต้องการทางกายภาพขั้นพื้นฐานที่สุดของมนุษย์ การจัดหาน้ำดื่มสะอาดและถูกสุขลักษณะจึงตอบโจทย์การดำเนินชีวิตของนักเรียน นักศึกษา และบุคลากรโดยตรง ส่งผลให้มีผู้เข้ามาใช้บริการครบถ้วนตามเป้าหมาย ":e+="ซึ่งสอดคล้องกับทฤษฎีแรงจูงใจและการมีส่วนร่วมที่ระบุไว้ในบทที่ 2 ",e+=`นอกจากนี้ยังสะท้อนถึงประสิทธิภาพของกระบวนการวางแผนประชาสัมพันธ์เชิงรุกตามขั้นตอน Plan ในวงจร PDCA (Deming, 1986) และการกระจายตัวของกลุ่มผู้เข้าร่วมกิจกรรมอย่างครอบคลุมทุกกลุ่มเป้าหมายตามข้อมูลประชากรศาสตร์ในบทที่ 4 (ข้อ 4.1) สอดคล้องกับหลักการบริหารแบบมีส่วนร่วม (Participative Management)

`,e+=`2) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงคุณภาพ (Qualitative Analysis & Discussion):
`,e+="ผลการประเมินความพึงพอใจต่อการดำเนินโครงการในบทที่ 4 (ข้อ 4.3) มีค่าเฉลี่ยในภาพรวมและรายด้านทั้ง 4 ด้านอยู่ในระดับมากที่สุดตามเกณฑ์ของเบสท์ (Best, 1977) ",m?e+=`ซึ่งสอดคล้องกับทฤษฎีคุณภาพการบริการ (SERVQUAL: Parasuraman, Zeithaml, & Berry, 1988) ในบทที่ 2 ในมิติด้านกายภาพที่สัมผัสได้ (Tangibles) และความเชื่อถือได้ (Reliability) ของจุดบริการน้ำดื่ม และสอดคล้องอย่างยิ่งกับผลงานวิจัยของ สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565) และ ภัทรดนัย บุญเรือง (2566) ในบทที่ 2 ที่พบว่า การพัฒนาระบบน้ำดื่มสะอาดและการดูแลสุขาภิบาลในสถานศึกษาตามวงจร PDCA ส่งผลให้ผู้เรียนมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด และช่วยส่งเสริมสุขภาวะที่ดีอย่างมีนัยสำคัญทางสถิติ

`:e+=`ซึ่งสอดคล้องกับทฤษฎีการเรียนรู้เชิงประสบการณ์ของ Kolb (1984) และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ที่พบว่าการจัดกิจกรรมพัฒนาทักษะวิชาชีพตามวงจร PDCA ส่งผลให้ผู้เรียนมีสมรรถนะวิชาชีพและความพึงพอใจสูงขึ้นอย่างมีนัยสำคัญ

`,e+=`3) การอภิปรายผลด้านการบริหารงบประมาณและความคุ้มค่า (Budget Efficiency & Good Governance):
`,e+=`ผลสัมฤทธิ์การใช้จ่ายงบประมาณในบทที่ 4 (ข้อ 4.4) เป็นไปอย่างถูกต้อง โปร่งใส ประหยัด และคุ้มค่าตามหลักธรรมาภิบาลของการบริหารงานภาครัฐ

`,e+=`4) การอภิปรายความสอดคล้องต่อนโยบายจุดเน้น ยุทธศาสตร์ สอศ. และวงจร PDCA:
`,e+="การดำเนินโครงการสอดคล้องโดยตรงกับยุทธศาสตร์ของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในบทที่ 2 (ข้อ 2.2) ในการเสริมสร้างสุขภาวะ ความปลอดภัยของผู้เรียน และการพัฒนาสิ่งแวดล้อมสาธารณูปโภคเพื่อสนับสนุนการจัดการศึกษาตามวงจรบริหารงานคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) อย่างครบวงจร",e};return t.jsxs("div",{className:"min-h-screen bg-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0 text-slate-900",children:[t.jsxs(C,{children:[t.jsx("title",{children:`รายงานผลโครงการ บทที่ 5 - ${r.title}`}),t.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),t.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),t.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap",rel:"stylesheet"})]}),t.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

                :root {
                    --doc-font-size: ${u.docSize};
                    --doc-line-height: ${u.lineHeight};
                    --title-font-size: ${u.titleSize};
                    --heading-font-size: ${u.headingSize};
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
            `}),t.jsxs("div",{className:"no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx(M,{href:route("dashboard"),className:"px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition",children:"← กลับหน้าศูนย์ควบคุม"}),t.jsx("span",{className:"text-xs font-bold text-slate-800",children:"📄 พิมพ์รูปเล่มรายงาน บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"flex items-center bg-slate-100 p-1 rounded-xl",children:["compact","normal","large"].map(s=>t.jsx("button",{type:"button",onClick:()=>k(s),className:`px-2.5 py-1 text-xs font-bold rounded-lg transition ${$===s?"bg-white text-purple-700 shadow-xs":"text-slate-600 hover:text-slate-900"}`,children:s==="compact"?"ก เล็ก":s==="normal"?"ก ปานกลาง":"ก ใหญ่"},s))}),t.jsxs("button",{type:"button",onClick:A,className:"px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer",children:[t.jsx("span",{children:"🖨️"})," พิมพ์เอกสาร A4 (Print)"]})]})]}),t.jsxs("div",{className:"print-doc-container font-sarabun mx-auto shadow-lg print:shadow-none border print:border-none border-slate-200",children:[t.jsxs("div",{className:"text-center mb-8",children:[t.jsx("h1",{className:"print-title mb-2",children:"บทที่ 5"}),t.jsx("h2",{className:"print-heading",children:"สรุปผล อภิปรายผล และข้อเสนอแนะ"})]}),t.jsx("div",{className:"thai-content thai-indent mb-7 text-justify leading-relaxed",children:j(x.intro||`การดำเนินงานโครงการ "${r.title}" ประจำปีการศึกษา ${j(r.academic_year)} ของ${r.location||"วิทยาลัยสารพัดช่างน่าน"} ได้ดำเนินการเสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และกรอบแผนงานที่กำหนด คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้`)}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.1 สรุปผลการดำเนินโครงการ"}),g(x.section_5_1||`การดำเนินงานโครงการ "${r.title}" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณได้อย่างครบถ้วนสมบูรณ์`,"5.1")]}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.2 การอภิปรายผลการดำเนินโครงการ"}),g(x.section_5_2||D(),"5.2")]}),t.jsxs("div",{className:"mb-7",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.3 ปัญหา อุปสรรค และแนวทางแก้ไข"}),g(x.section_5_3||"จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขที่คณะผู้ดำเนินงานได้แก้ไขปัญหาอย่างมีประสิทธิภาพ","5.3")]}),t.jsxs("div",{className:"mb-8",children:[t.jsx("h3",{className:"print-heading font-bold mb-3 text-slate-900",children:"5.4 ข้อเสนอแนะ"}),g(x.section_5_4||"ข้อเสนอแนะในการนำผลไปใช้ประโยชน์ และข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป","5.4")]}),t.jsx("div",{className:"mt-12 pt-6 flex justify-end page-break-inside-avoid",children:t.jsxs("div",{className:"text-center w-72 space-y-1",children:[t.jsx("p",{className:"text-xs",children:"ลงชื่อ........................................................"}),t.jsxs("p",{className:"text-xs font-bold",children:["(",r.user?.name||r.responsible_person||"ผู้รับผิดชอบโครงการ",")"]}),t.jsx("p",{className:"text-xs text-slate-600",children:"ผู้รับผิดชอบโครงการ"}),t.jsx("p",{className:"text-xs text-slate-500 mt-2",children:"วันที่ ..... เดือน .................... พ.ศ. ........"})]})})]})]})}export{I as default};

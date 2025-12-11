import React, { useState, useEffect } from 'react';
import { CertificateModalProps } from '../types';
import { X, Download, Printer } from 'lucide-react';

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, student, settings, onClose }) => {
  const [certType, setCertType] = useState<'bonafide' | 'study'>('study');
  
  // State for editable fields in the Study Certificate
  const [studyCertData, setStudyCertData] = useState({
    fromClass: '',
    toClass: '',
    fromYear: '',
    toYear: '',
    place: '',
    date: new Date().toLocaleDateString('en-GB'),
  });

  useEffect(() => {
    if (student) {
      setStudyCertData({
        fromClass: '',
        toClass: student.standard,
        fromYear: '',
        toYear: settings.academicYear.split('-')[1],
        place: 'Nittur [B]',
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD for input
      });
    }
  }, [student, settings.academicYear]);

  if (!isOpen || !student) return null;

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-certificate');
    if (!element) return;
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      const opt = {
        margin: 0.5,
        filename: `${certType}_${student.name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudyCertData(prev => ({ ...prev, [name]: value }));
  };

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const genderPronoun = student.gender === 'Female' ? 'She' : 'He';
  const childPronoun = student.gender === 'Female' ? 'daughter' : 'son';
  const namePrefix = student.gender === 'Female' ? 'Kumari' : 'Sri';

  const renderBonafideCertificate = () => (
    <>
       <header className="text-center mb-12">
         <div className="flex items-center justify-center gap-4 mb-4">
           {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="h-20 w-20 object-contain" />}
           <div>
              <h1 className="text-4xl font-bold text-slate-900">{settings.name}</h1>
              <p className="text-md text-slate-600 mt-1">{settings.address}</p>
           </div>
         </div>
         <div className="inline-block mt-8 px-6 py-2 border-2 border-slate-800 rounded text-xl font-semibold uppercase tracking-widest">
            Bonafide Certificate
         </div>
      </header>
      
      <div className="flex justify-between text-lg mb-16">
         <p>Ref No: SVS/{student.id}/{new Date().getFullYear()}</p>
         <p>Date: {today}</p>
      </div>

      <div className="text-lg leading-relaxed space-y-8 text-justify">
        <p>This is to certify that <span className="font-bold">{student.name}</span>, {childPronoun} of <span className="font-bold">{student.parentName}</span>, is a bonafide student of this institution.</p>
        <p>{genderPronoun} is studying in <span className="font-bold">Class {student.standard}</span> ({student.medium} Medium) during the academic year <span className="font-bold">{settings.academicYear}</span>.</p>
        <p>As per our school records, {genderPronoun.toLowerCase()} is sincere, hardworking, and bears a good moral character.</p>
        <p>We wish {genderPronoun.toLowerCase()} all the success in future endeavors.</p>
      </div>

      <div className="absolute bottom-24 right-16 text-center">
        <div className="h-20 w-48 mb-2 flex items-center justify-center">
           {settings.principalSignature && <img src={settings.principalSignature} alt="Signature" className="h-full object-contain" />}
        </div>
        <p className="text-lg font-semibold text-slate-900 border-t-2 border-slate-400 pt-2 px-8">
           Principal
        </p>
      </div>
    </>
  );
  
  const renderStudyCertificate = () => (
    <div className="border-4 border-black p-8 font-serif h-full flex flex-col text-black">
      <h1 className="text-center text-4xl font-bold tracking-widest mb-4">STUDY CERTIFICATE</h1>
      
      <div className="text-right mb-4">
        <div className="inline-block border border-black px-2 py-1 text-lg">
          Adm.No. <span className="font-semibold">{student.id}</span>
        </div>
      </div>
      
      <p className="text-xl mb-6">PUPS/PUMS <span className="font-bold">{settings.name}</span></p>

      <div className="text-lg leading-loose">
        <p>
          This is to certify that {namePrefix}&nbsp;
          <span className="font-bold border-b border-dotted border-black px-2">{student.name}</span>,
          Son/Daughter of Sri&nbsp;
          <span className="font-bold border-b border-dotted border-black px-2">{student.parentName}</span>
          &nbsp;studied in this School from&nbsp;
          <input type="text" name="fromClass" value={studyCertData.fromClass} onChange={handleInputChange} className="w-20 border-b border-dotted border-black text-center font-bold outline-none no-print text-black" placeholder="........"/>
          &nbsp;Class to&nbsp;
          <input type="text" name="toClass" value={studyCertData.toClass} onChange={handleInputChange} className="w-20 border-b border-dotted border-black text-center font-bold outline-none no-print text-black" placeholder="........"/>
          &nbsp;Class, during the Academic years from&nbsp;
          <input type="text" name="fromYear" value={studyCertData.fromYear} onChange={handleInputChange} className="w-24 border-b border-dotted border-black text-center font-bold outline-none no-print text-black" placeholder="............"/>
          &nbsp;to&nbsp;
          <input type="text" name="toYear" value={studyCertData.toYear} onChange={handleInputChange} className="w-24 border-b border-dotted border-black text-center font-bold outline-none no-print text-black" placeholder="............"/>.
        </p>
      </div>
      
      <div className="flex-1 flex items-center justify-center my-8">
        <div className="w-32 h-32 border-2 border-black flex items-center justify-center text-slate-400 text-sm">
          Photo/Stamp
        </div>
      </div>
      
      <div className="flex justify-between items-end">
        <div className="text-lg space-y-4">
          <p>Place: <input type="text" name="place" value={studyCertData.place} onChange={handleInputChange} className="w-48 border-b border-dotted border-black font-bold outline-none no-print text-black" /></p>
          <p>Date: <input type="date" name="date" value={studyCertData.date} onChange={handleInputChange} className="w-48 border-b border-dotted border-black font-bold outline-none no-print text-black" /></p>
        </div>
        <div className="text-center text-lg">
           <div className="h-16 w-48 mb-2 flex items-center justify-center">
              {settings.principalSignature && <img src={settings.principalSignature} alt="Signature" className="h-full object-contain" />}
           </div>
          <p className="font-semibold">Signature of the</p>
          <p className="font-semibold">Head Master/ Headmistress</p>
        </div>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm printable-modal-container">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden print:shadow-none print:w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 no-print sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
             <h3 className="font-semibold text-slate-700">Certificate Generator</h3>
             <select value={certType} onChange={e => setCertType(e.target.value as any)} className="bg-slate-100 border-slate-200 border p-1 rounded-md text-sm">
                <option value="bonafide">Bonafide Certificate</option>
                <option value="study">Study Certificate</option>
             </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              <Download size={16} /> PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
          <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-lg print:shadow-none font-serif relative" id="printable-certificate">
            {certType === 'study' ? renderStudyCertificate() : renderBonafideCertificate()}
          </div>
        </div>
      </div>
    </div>
  );
};

const fs = require('fs');
let file = fs.readFileSync('src/components/MentorPortal.tsx', 'utf8');
const startTag = '{/* 3. ROSTER USAHAWAN BERDAFTAR (MANAGEMENT TABLE & FILTERS) */}';
const endTag = '{/* 4. MODAL: TULIS NOTA BIMBINGAN & PELAN TINDAKAN USAHAWAN */}';

const startIdx = file.indexOf(startTag);
const endIdx = file.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
  console.error('Tags not found', { startIdx, endIdx });
  process.exit(1);
}

const replacement = `{/* 3. TAILADMIN 3-COLUMN CONTENT GRID MATCHING REFERENCE WIREFRAME */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolum 1: Senarai Pendaftaran Mentee (Roster & Quick Filters) */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Senarai Usahawan Belia
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {filteredRegistrations.length} Usahawan
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, bisnes atau topik..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
              {(['all', 'pending', 'confirmed', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={\`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer \${
                    statusFilter === tab
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }\`}
                >
                  {tab === 'all' ? 'Semua' : tab === 'pending' ? \`Menunggu (\${pendingCount})\` : tab === 'confirmed' ? \`Disahkan (\${confirmedCount})\` : \`Selesai (\${completedCount})\`}
                </button>
              ))}
            </div>

            {/* Mentee List Container */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tiada rekod padanan.</p>
                </div>
              ) : (
                filteredRegistrations.map(mentee => {
                  const isPending = mentee.status === 'pending';
                  const isConfirmed = mentee.status === 'confirmed';
                  const isCompleted = mentee.status === 'completed';

                  return (
                    <div
                      key={mentee.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {mentee.entrepreneurName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {mentee.businessName} &middot; <span className="font-semibold text-purple-600 dark:text-purple-400">{mentee.topic}</span>
                          </p>
                        </div>
                        <span className={\`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 \${
                          isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : isConfirmed
                            ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                            : isPending
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                        }\`}>
                          {isCompleted ? 'Selesai' : isConfirmed ? 'Disahkan' : isPending ? 'Menunggu' : 'Batal'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                        <a
                          href={\`https://wa.me/\${mentee.phone.replace(/[^0-9]/g, '')}?text=Salam%20\${encodeURIComponent(mentee.entrepreneurName)}\`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        <div className="flex items-center gap-1">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(mentee, 'confirmed')}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                            >
                              Sahkan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenNotesModal(mentee)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 cursor-pointer"
                          >
                            Nota
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Sesi bimbingan aktif UMK CEED</span>
            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">KBELIA 2026</span>
          </div>
        </div>

        {/* Kolum 2: Jadual Sesi Temuduga & Bimbingan Terdekat */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Jadual Klinik Terdekat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSlotModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Slot Baru</span>
              </button>
            </div>

            {/* Upcoming Confirmed Sessions */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {mentorRegistrations.filter(m => m.status === 'confirmed').length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-50" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tiada temuduga aktif ditetapkan.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sahkan permohonan menunggu di Kolum 1 untuk menjadualkan temu janji.</p>
                </div>
              ) : (
                mentorRegistrations.filter(m => m.status === 'confirmed').map((mentee) => (
                  <div
                    key={mentee.id}
                    className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{mentee.preferredDate || 'Akan Ditetapkan'} &middot; {mentee.preferredTime || '10:00 AM'}</span>
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        Disahkan
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {mentee.entrepreneurName} ({mentee.businessName})
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        Topik: <span className="font-semibold">{mentee.topic}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40">
                      {mentee.meetingLink ? (
                        <a
                          href={mentee.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Sertai Google Meet</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Hub Keusahawanan UMK
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStatusChange(mentee, 'completed')}
                        className="px-2.5 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selesai</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Penyeliaan Temuduga Maya & Fizikal</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">CEED UMK</span>
          </div>
        </div>

        {/* Kolum 3: Pelan Tindakan & Nota Bimbingan Mentor */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Pelan Tindakan Usahawan
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {mentorRegistrations.filter(m => m.mentorActionPlan).length} Dihantar
              </span>
            </div>

            {/* Action Plans Feed */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {mentorRegistrations.filter(m => m.mentorActionPlan).length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Belum ada pelan tindakan dihantar.</p>
                  <p className="text-[11px] text-slate-400">Tekan butang "Nota" di Kolum 1 untuk menyediakan panduan dan tugasan bagi mentee anda.</p>
                </div>
              ) : (
                mentorRegistrations.filter(m => m.mentorActionPlan).map((mentee) => (
                  <div
                    key={mentee.id}
                    className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {mentee.entrepreneurName}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenNotesModal(mentee)}
                        className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Kemaskini
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 leading-relaxed font-sans">
                      {mentee.mentorActionPlan}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Topik: {mentee.topic}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Tersimpan di Profil</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pemantauan Prestasi Belia Kelantan</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Patuh KPI</span>
          </div>
        </div>

      </div>

      `;

file = file.substring(0, startIdx) + replacement + file.substring(endIdx);
fs.writeFileSync('src/components/MentorPortal.tsx', file, 'utf8');
console.log('Successfully structured MentorPortal into 3 balanced columns');

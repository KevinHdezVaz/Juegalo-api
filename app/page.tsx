export default function LandingPage() {
  return (
    <main style={{ overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 40px", height: 64,
        background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark />
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>JUEGALO</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="#como-funciona" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Cómo funciona</a>
          <a href="#gana" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Formas de ganar</a>
          <a href="#retiros" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Retiros</a>
          <a href="https://play.google.com/store/apps/details?id=com.kevinhv.juegalo" className="btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
            Descargar gratis
          </a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "100px 24px 80px",
        background: "linear-gradient(170deg, #fff 0%, var(--azul-soft) 55%, #fff 100%)",
        textAlign: "center",
      }}>
        {/* Decorative blobs */}
        <div className="blob" style={{ width: 600, height: 600, top: -200, left: "-10%", background: "rgba(37,99,235,0.08)" }} />
        <div className="blob" style={{ width: 400, height: 400, bottom: -100, right: "-5%", background: "rgba(201,168,76,0.12)" }} />
        <div className="blob" style={{ width: 300, height: 300, top: 100, right: "20%", background: "rgba(124,58,237,0.06)" }} />

        {/* Pill badge */}
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--azul-soft)", border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: 999, padding: "7px 18px", marginBottom: 32,
        }}>
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--green)", display: "inline-block",
            }} />
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "var(--green)", animation: "pulse-ring 1.5s ease-out infinite",
            }} />
          </span>
          <span style={{ fontSize: 13, color: "var(--azul)", fontWeight: 600 }}>
            Disponible gratis en Android e iOS
          </span>
        </div>

        {/* Headline */}
        <h1 className="fade-up-2" style={{
          fontSize: "clamp(40px, 7.5vw, 76px)", fontWeight: 900,
          lineHeight: 1.04, margin: "0 auto 24px",
          letterSpacing: -2.5, maxWidth: 760,
        }}>
          Convierte tu tiempo libre en{" "}
          <span className="gradient-text">dinero real</span>
        </h1>

        <p className="fade-up-3" style={{
          fontSize: 19, color: "var(--muted)", maxWidth: 500,
          margin: "0 auto 48px", lineHeight: 1.7,
        }}>
          Encuestas, videos, ofertas y más. Acumula monedas y retira por PayPal cuando quieras — sin trampa.
        </p>

        {/* CTA buttons */}
        <div className="fade-up-4" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <a href="https://play.google.com/store/apps/details?id=com.kevinhv.juegalo" className="btn-primary">
            <GooglePlayIcon /> Google Play
          </a>
          <a href="https://apps.apple.com/app/juegalo" className="btn-secondary">
            <AppleIcon /> App Store
          </a>
        </div>

        {/* Stats cards */}
        <div className="fade-up-4" style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "var(--card)",
          borderRadius: 20, border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
          overflow: "hidden", maxWidth: 680, width: "100%",
        }}>
          {[
            { value: "100%", label: "Gratis", color: "var(--azul)" },
            { value: "PayPal", label: "Retiros", color: "var(--green)" },
            { value: "1,000+", label: "Bono referido", color: "var(--gold)" },
            { value: "Top 3", label: "Ranking semanal", color: "var(--purple)" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              padding: "22px 16px", textAlign: "center",
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TICKER / SOCIAL PROOF
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "var(--azul)", padding: "14px 0",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}>
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[...Array(2)].map((_, gi) => (
              <div key={gi} style={{ display: "flex", gap: 0 }}>
                {[
                  "Encuestas disponibles",
                  "Retira por PayPal",
                  "Bono diario",
                  "Ranking semanal",
                  "Invita amigos",
                  "Videos cortos",
                  "Ofertas exclusivas",
                  "Sin comisiones",
                ].map((item) => (
                  <span key={item} style={{
                    display: "inline-flex", alignItems: "center", gap: 12,
                    padding: "0 32px", color: "rgba(255,255,255,0.85)",
                    fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 8 }}>●</span>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section id="como-funciona" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <SectionLabel color="var(--azul)">Cómo funciona</SectionLabel>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: "12px 0 64px", letterSpacing: -1.5, textAlign: "center" }}>
            Gana en 3 simples pasos
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 24 }}>
            {[
              {
                step: "01", color: "var(--azul)", bg: "var(--azul-soft)",
                icon: <UserIcon />,
                title: "Descarga e ingresa",
                desc: "Crea tu cuenta en segundos con Google o correo. No necesitas tarjeta ni datos bancarios. Empieza gratis desde el primer minuto.",
              },
              {
                step: "02", color: "var(--purple)", bg: "#F5F3FF",
                icon: <TaskIcon />,
                title: "Completa tareas",
                desc: "Encuestas, videos, ofertas y más. Cada tarea suma monedas a tu saldo al instante. Más tareas = más monedas.",
              },
              {
                step: "03", color: "var(--green)", bg: "#F0FDF4",
                icon: <WalletIcon />,
                title: "Retira tu dinero",
                desc: "Convierte tus monedas en saldo real y solicita tu retiro por PayPal o MercadoPago cuando quieras.",
              },
            ].map((item) => (
              <div key={item.step} className="card-hover" style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 22, padding: "36px 30px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 24, right: 24,
                  fontSize: 64, fontWeight: 900, lineHeight: 1,
                  color: item.bg, userSelect: "none", zIndex: 0,
                }}>{item.step}</div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: item.bg, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    marginBottom: 22, color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════════════════ */}
      <section id="gana" style={{ padding: "96px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <SectionLabel color="var(--azul)">Formas de ganar</SectionLabel>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: "12px 0 16px", letterSpacing: -1.5, textAlign: "center" }}>
            Múltiples fuentes de ingresos
          </h2>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 16, margin: "0 auto 56px", maxWidth: 440 }}>
            No dependas de una sola actividad. Combina todas para maximizar tus ganancias diarias.
          </p>

          {/* Big feature — Encuestas */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 24, padding: "40px", marginBottom: 20,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40,
            alignItems: "center",
          }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--azul-soft)", borderRadius: 10,
                padding: "6px 14px", marginBottom: 20,
              }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span style={{ fontSize: 13, color: "var(--azul)", fontWeight: 700 }}>Más Popular</span>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 14px", letterSpacing: -0.8 }}>Encuestas</h3>
              <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 24px" }}>
                Responde encuestas de empresas reales sobre productos, servicios y hábitos de consumo. Cada encuesta completada suma entre 96 y 1,260 monedas directamente a tu saldo.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["Pago inmediato", "Sin límite diario", "Variedad de temas"].map((tag) => (
                  <span key={tag} style={{
                    background: "var(--azul-soft)", color: "var(--azul)",
                    borderRadius: 8, padding: "5px 12px",
                    fontSize: 12, fontWeight: 600,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
            <div style={{
              background: "var(--azul-soft)", borderRadius: 18,
              padding: "24px", display: "flex", flexDirection: "column", gap: 10,
            }}>
              {[
                { coins: "1,260", mins: "8 min", stars: 5 },
                { coins: "654", mins: "5 min", stars: 4 },
                { coins: "510", mins: "6 min", stars: 5 },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 12,
                  padding: "14px 18px", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                  border: "1px solid var(--border)",
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--azul)" }}>
                      {s.coins} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>monedas</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.mins} • {"★".repeat(s.stars)}</div>
                  </div>
                  <div style={{
                    background: "var(--azul)", color: "#fff",
                    borderRadius: 8, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700,
                  }}>Iniciar →</div>
                </div>
              ))}
            </div>
          </div>

          {/* Small features grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { icon: "▶", color: "var(--red)", bg: "#FEF2F2", title: "Videos", desc: "Ve videos cortos y acumula monedas sin esfuerzo." },
              { icon: "🎯", color: "var(--purple)", bg: "#F5F3FF", title: "Ofertas", desc: "Instala apps y completa misiones para multiplicar ganancias." },
              { icon: "🏆", color: "var(--gold)", bg: "#FFFBEB", title: "Ranking", desc: "Compite semanalmente. Los top 3 reciben premios extra." },
              { icon: "👥", color: "var(--green)", bg: "#F0FDF4", title: "Referidos", desc: "Invita amigos y ambos reciben 1,000 monedas." },
              { icon: "🎁", color: "#EC4899", bg: "#FDF2F8", title: "Bono diario", desc: "Entra cada día y reclama tu bono de racha." },
            ].map((f) => (
              <div key={f.title} className="card-hover" style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 18, padding: "24px 20px",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: f.bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14, color: f.color,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WITHDRAWAL SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="retiros" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <SectionLabel color="var(--green)" align="left">Retiros</SectionLabel>
            <h2 style={{ fontSize: 40, fontWeight: 900, margin: "12px 0 20px", letterSpacing: -1.5, lineHeight: 1.1 }}>
              Tu dinero,{" "}
              <span style={{ color: "var(--green)" }}>cuando quieras</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.75, marginBottom: 36 }}>
              Sin mínimos absurdos. Sin esperas de semanas. Solicita tu retiro directamente desde la app y recibe el dinero en tu cuenta PayPal o MercadoPago.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "⚡", title: "Rápido", desc: "Procesamos tu retiro en menos de 24 horas." },
                { icon: "🔒", title: "Seguro", desc: "Transacciones cifradas y verificadas." },
                { icon: "💰", title: "Sin comisiones", desc: "Recibes exactamente lo que solicitas." },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: "#F0FDF4", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Wallet card */}
            <div style={{
              background: "linear-gradient(135deg, var(--azul) 0%, var(--azul-dark) 100%)",
              borderRadius: 24, padding: "32px",
              boxShadow: "0 20px 60px rgba(37,99,235,0.3)",
            }}>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Saldo disponible
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: -2, marginBottom: 24 }}>
                $5.15
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{
                  flex: 1, background: "rgba(255,255,255,0.15)",
                  borderRadius: 12, padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>Monedas</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>5,150</div>
                </div>
                <div style={{
                  flex: 1, background: "rgba(255,255,255,0.85)",
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--azul)" }}>Solicitar cobro</span>
                </div>
              </div>
            </div>
            {/* Payment methods */}
            {[
              { name: "PayPal", sub: "Transferencia directa a tu cuenta", icon: "💳", color: "#0070BA" },
              { name: "MercadoPago", sub: "Disponible en toda Latinoamérica", icon: "🔵", color: "#00A2E8" },
            ].map((m) => (
              <div key={m.name} className="card-hover" style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "18px 22px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--bg)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: m.color }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.sub}</div>
                </div>
                <div style={{ color: "var(--faint)", fontSize: 18 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          REFERRAL
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "var(--bg)" }}>
        <div style={{
          maxWidth: 760, margin: "0 auto",
          background: "var(--card)", borderRadius: 28,
          border: "1px solid var(--border)",
          padding: "56px 48px", textAlign: "center",
          boxShadow: "0 12px 48px rgba(0,0,0,0.06)",
          position: "relative", overflow: "hidden",
        }}>
          <div className="blob" style={{ width: 300, height: 300, top: -100, left: -80, background: "rgba(22,163,74,0.07)" }} />
          <div className="blob" style={{ width: 200, height: 200, bottom: -60, right: -40, background: "rgba(37,99,235,0.06)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: "#F0FDF4", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 34, margin: "0 auto 24px",
            }}>👥</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 16px", letterSpacing: -1 }}>
              Gana más invitando amigos
            </h2>
            <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 440, marginInline: "auto" }}>
              Comparte tu código de referido. Cuando tu amigo complete su primer retiro, <strong style={{ color: "var(--text)" }}>los dos reciben 1,000 monedas</strong> de regalo al instante.
            </p>
            <div style={{
              display: "inline-grid", gridTemplateColumns: "1fr auto 1fr",
              gap: 0, background: "var(--bg)",
              borderRadius: 16, border: "1px solid var(--border)",
              overflow: "hidden", marginBottom: 36,
            }}>
              <div style={{ padding: "20px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Tú recibes</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--green)" }}>+1,000 monedas</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "0 16px", color: "var(--faint)", fontSize: 24 }}>+</div>
              <div style={{ padding: "20px 32px", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Tu amigo recibe</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--azul)" }}>+1,000 monedas</div>
              </div>
            </div>
            <a href="https://play.google.com/store/apps/details?id=com.kevinhv.juegalo" className="btn-primary">
              Obtener mi código de referido
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "96px 24px",
        background: "linear-gradient(135deg, var(--azul) 0%, var(--azul-dark) 100%)",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div className="blob" style={{ width: 500, height: 500, top: -150, left: "20%", background: "rgba(255,255,255,0.05)" }} />
        <div className="blob" style={{ width: 300, height: 300, bottom: -100, right: "10%", background: "rgba(201,168,76,0.12)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: -2, lineHeight: 1.1 }}>
            Empieza a ganar hoy
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, margin: "0 0 48px" }}>
            Gratis. Sin tarjeta. Sin trampa. Solo instala y gana.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://play.google.com/store/apps/details?id=com.kevinhv.juegalo" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#fff", color: "var(--azul)",
              padding: "16px 32px", borderRadius: 14,
              textDecoration: "none", fontWeight: 800, fontSize: 15,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              transition: "transform 0.15s ease",
            }}>
              <GooglePlayIcon /> Google Play
            </a>
            <a href="https://apps.apple.com/app/juegalo" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.12)", color: "#fff",
              padding: "16px 32px", borderRadius: 14,
              textDecoration: "none", fontWeight: 800, fontSize: 15,
              border: "1.5px solid rgba(255,255,255,0.25)",
              transition: "transform 0.15s ease",
            }}>
              <AppleIcon /> App Store
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid var(--border)", background: "#fff",
        padding: "36px 40px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>JUEGALO</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>© 2026 Kave MX. Todos los derechos reservados.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "Privacidad", href: "/privacidad" },
            { label: "Eliminar cuenta", href: "/eliminar-cuenta" },
            { label: "Contacto", href: "mailto:soporte@juegalo.app" },
          ].map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}

/* ── Shared components ─────────────────────────────────────── */

function SectionLabel({ children, color, align = "center" }: { children: string; color: string; align?: string }) {
  return (
    <div style={{ textAlign: align as "center" | "left", marginBottom: 0 }}>
      <span style={{
        fontSize: 12, fontWeight: 700, letterSpacing: 1.8,
        color, textTransform: "uppercase",
      }}>{children}</span>
    </div>
  );
}

function LogoMark() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 9,
      background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>J</span>
    </div>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.18 23.76c.37.2.8.2 1.18.02l11.62-6.72-2.5-2.52-10.3 9.22zm-1.68-20.4C1.19 3.7 1 4.1 1 4.6v14.8c0 .5.19.9.5 1.24l.07.06 8.29-8.29v-.2L1.5 3.3l-.01.06zm17.96 8.96l-2.35-1.36-2.73 2.73 2.73 2.73 2.38-1.38c.68-.39.68-1.33-.03-1.72zm-16.28 9.2l10.3-9.23-2.5-2.5-7.8 11.73z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}

function TaskIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 12l2 2 4-4"/></svg>;
}

function WalletIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M2 10h20"/></svg>;
}

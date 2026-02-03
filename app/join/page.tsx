'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function JoinPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let stars: { x: number; y: number; s: number; sp: number; o: number; tw: number }[] = []
    let animId: number

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    function make(n: number) {
      stars = []
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          s: Math.random() * 1.6 + 0.2,
          sp: Math.random() * 0.25 + 0.04,
          o: Math.random() * 0.65 + 0.3,
          tw: Math.random() * 0.018 + 0.004,
        })
      }
    }
    function draw(t: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      stars.forEach((s) => {
        s.y += s.sp
        if (s.y > canvas!.height) {
          s.y = 0
          s.x = Math.random() * canvas!.width
        }
        const tw = Math.sin(t * s.tw) * 0.3 + 0.7
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.s, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(190,210,240,${s.o * tw})`
        ctx!.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    resize()
    make(180)
    animId = requestAnimationFrame(draw)
    window.addEventListener('resize', () => {
      resize()
      make(180)
    })
    return () => cancelAnimationFrame(animId)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('vis')
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.rv').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const nav = document.getElementById('jnav')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Build hex grid
  useEffect(() => {
    const g = document.getElementById('hexGrid')
    if (!g || g.children.length > 0) return
    const cols = 6, rows = 5, W = 52, H = 60, oX = W * 0.76, oY = H * 0.76
    const hq = [2, 2]
    const en = [[1, 1], [3, 1], [1, 3], [4, 2]]
    const cr = [[0, 2], [3, 4]]
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const h = document.createElement('div')
        h.classList.add('hx')
        h.style.left = (c * oX + (r % 2 ? oX / 2 : 0)) + 'px'
        h.style.top = (r * oY) + 'px'
        if (r === hq[0] && c === hq[1]) h.classList.add('hq')
        else if (en.some((t) => t[0] === r && t[1] === c)) h.classList.add('et')
        else if (cr.some((t) => t[0] === r && t[1] === c)) h.classList.add('ct')
        else h.classList.add('uk')
        g.appendChild(h)
      }
    }
  }, [])

  const GAME_URL = 'https://www.energy-empire.space'
  const REF_URL = 'https://yieldverse.io/register'

  return (
    <>
      <style jsx global>{`
        /* ═══ JOIN PAGE STYLES ═══ */
        .join-page { font-family: 'Rajdhani', sans-serif; background: #080c18; color: #e8edf5; overflow-x: hidden; line-height: 1.6; }
        .join-page canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

        /* NAV */
        .jnav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: .85rem 2rem; display: flex; align-items: center; justify-content: space-between; background: rgba(8,12,24,.72); backdrop-filter: blur(22px); border-bottom: 1px solid rgba(255,255,255,.06); transition: box-shadow .3s; }
        .jnav.scrolled { box-shadow: 0 4px 40px rgba(0,0,0,.6); }
        .jnav-brand { display: flex; align-items: center; gap: .7rem; text-decoration: none; }
        .jnav-icon { width: 38px; height: 38px; border-radius: 9px; background: linear-gradient(135deg, #f5a623, #ff6b35); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; box-shadow: 0 0 16px rgba(245,166,35,.35); }
        .jnav-t { font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 1rem; letter-spacing: 2px; color: #e8edf5; }
        .jnav-s { font-size: .62rem; color: #7a8ba8; letter-spacing: 3px; text-transform: uppercase; }
        .jnav-links { display: flex; gap: 1.8rem; align-items: center; }
        .jnav-links a { font-weight: 600; font-size: .92rem; color: #7a8ba8; transition: color .25s; letter-spacing: .4px; text-decoration: none; }
        .jnav-links a:hover { color: #f5a623; }
        .jbtn-play { padding: .5rem 1.4rem; border-radius: 8px; background: linear-gradient(135deg, #00e68a, #00c978); color: #080c18; font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .78rem; letter-spacing: 1.5px; border: none; cursor: pointer; transition: all .25s; box-shadow: 0 0 18px rgba(0,230,138,.25); text-decoration: none; display: inline-block; }
        .jbtn-play:hover { transform: translateY(-2px); box-shadow: 0 0 32px rgba(0,230,138,.45); }

        /* HERO */
        .jhero { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8rem 2rem 4rem; overflow: hidden; }
        .jhero::before { content: ''; position: absolute; top: 50%; left: 50%; width: 700px; height: 700px; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(circle, rgba(245,166,35,.08), rgba(255,107,53,.04) 40%, transparent 70%); pointer-events: none; animation: jhp 6s ease-in-out infinite; }
        @keyframes jhp { 0%,100% { opacity: .6; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15); } }
        .jbadge { display: inline-flex; align-items: center; gap: .5rem; padding: .35rem 1.1rem; border-radius: 50px; background: rgba(245,166,35,.08); border: 1px solid rgba(245,166,35,.18); font-family: 'Space Mono', monospace; font-size: .7rem; color: #f5a623; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2rem; animation: jfsu .8s ease both; }
        .jbadge .jdot { width: 6px; height: 6px; border-radius: 50%; background: #00e68a; animation: jbk 2s infinite; }
        @keyframes jbk { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        .jhero h1 { font-family: 'Orbitron', sans-serif; font-size: clamp(2.6rem, 7.5vw, 6rem); font-weight: 900; line-height: 1.05; letter-spacing: 3px; margin-bottom: .4rem; animation: jfsu .8s ease .15s both; }
        .jge { background: linear-gradient(135deg, #ffcc02, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .jgy { background: linear-gradient(135deg, #00ff9d, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .jhero-sub { font-size: .45em; font-weight: 500; letter-spacing: 6px; color: #7a8ba8; -webkit-text-fill-color: #7a8ba8; }
        .jhtag { font-size: clamp(1rem, 2.4vw, 1.35rem); color: #7a8ba8; max-width: 620px; margin: 1rem auto 2.2rem; font-weight: 400; animation: jfsu .8s ease .3s both; }
        .jhctas { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; animation: jfsu .8s ease .45s both; }
        .jcp { display: inline-flex; align-items: center; gap: .5rem; padding: .8rem 2.2rem; border-radius: 11px; background: linear-gradient(135deg, #f5a623, #ff6b35); color: #080c18; font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .85rem; letter-spacing: 1.5px; border: none; cursor: pointer; transition: all .3s; box-shadow: 0 4px 28px rgba(245,166,35,.3); text-decoration: none; }
        .jcp:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 40px rgba(245,166,35,.5); }
        .jcs { display: inline-flex; align-items: center; gap: .5rem; padding: .8rem 2.2rem; border-radius: 11px; background: transparent; color: #e8edf5; font-family: 'Orbitron', sans-serif; font-weight: 600; font-size: .82rem; letter-spacing: 1.5px; border: 1px solid rgba(255,255,255,.13); cursor: pointer; transition: all .3s; text-decoration: none; }
        .jcs:hover { border-color: #00e68a; color: #00e68a; box-shadow: 0 0 22px rgba(0,230,138,.12); }
        .jhstats { display: flex; gap: 2.5rem; margin-top: 3.5rem; animation: jfsu .8s ease .6s both; }
        .jhs { text-align: center; }
        .jhsv { font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 1.5rem; }
        .jhsl { font-size: .7rem; color: #4a5873; letter-spacing: 2px; text-transform: uppercase; margin-top: .15rem; }
        .jhscroll { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: .3rem; color: #4a5873; font-size: .65rem; letter-spacing: 2px; animation: jsb 2.5s infinite; }
        .jhscroll .jchev { width: 18px; height: 18px; border-right: 2px solid #4a5873; border-bottom: 2px solid #4a5873; transform: rotate(45deg); }
        @keyframes jsb { 0%,100% { opacity: .4; transform: translateX(-50%) translateY(0); } 50% { opacity: 1; transform: translateX(-50%) translateY(8px); } }
        @keyframes jfsu { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }

        /* SECTIONS */
        .join-page section { position: relative; z-index: 1; padding: 6rem 2rem; }
        .jcon { max-width: 1120px; margin: 0 auto; }
        .jsl { font-family: 'Space Mono', monospace; font-size: .7rem; letter-spacing: 4px; text-transform: uppercase; color: #f5a623; margin-bottom: .5rem; }
        .jst { font-family: 'Orbitron', sans-serif; font-size: clamp(1.7rem, 3.8vw, 2.6rem); font-weight: 800; line-height: 1.15; margin-bottom: .8rem; }
        .jsd { color: #7a8ba8; font-size: 1.02rem; max-width: 550px; line-height: 1.7; }
        .rv { opacity: 0; transform: translateY(36px); transition: opacity .7s ease, transform .7s ease; }
        .rv.vis { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: .1s; } .d2 { transition-delay: .2s; } .d3 { transition-delay: .3s; } .d4 { transition-delay: .4s; } .d5 { transition-delay: .5s; }

        /* PIPELINE */
        .jpipe { background: linear-gradient(180deg, transparent, rgba(15,22,41,.6) 15%, rgba(15,22,41,.6) 85%, transparent); }
        .jpf { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.4rem; margin-top: 3rem; position: relative; }
        .jpf::before { content: ''; position: absolute; top: 50px; left: 10%; right: 10%; height: 2px; background: linear-gradient(90deg, #f5a623, #ff6b35, #00ff9d, #06b6d4); opacity: .25; border-radius: 2px; }
        .jps { text-align: center; position: relative; }
        .jpi { width: 76px; height: 76px; margin: 0 auto 1.1rem; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; border: 2px solid rgba(255,255,255,.06); transition: all .4s; position: relative; z-index: 2; background: #0f1629; }
        .jps:nth-child(1) .jpi { border-color: rgba(245,166,35,.22); background: linear-gradient(135deg, rgba(245,166,35,.1), #0f1629); }
        .jps:nth-child(2) .jpi { border-color: rgba(255,107,53,.22); background: linear-gradient(135deg, rgba(255,107,53,.1), #0f1629); }
        .jps:nth-child(3) .jpi { border-color: rgba(0,230,138,.22); background: linear-gradient(135deg, rgba(0,230,138,.1), #0f1629); }
        .jps:nth-child(4) .jpi { border-color: rgba(6,182,212,.22); background: linear-gradient(135deg, rgba(6,182,212,.1), #0f1629); }
        .jps:hover .jpi { transform: translateY(-5px) scale(1.06); box-shadow: 0 8px 36px rgba(0,0,0,.3); }
        .jpa { color: #4a5873; font-family: 'Orbitron', sans-serif; font-size: .75rem; position: absolute; top: 28px; right: -16px; z-index: 3; }
        .jptt { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .85rem; letter-spacing: 1px; margin-bottom: .25rem; }
        .jps:nth-child(1) .jptt { color: #f5a623; } .jps:nth-child(2) .jptt { color: #ff6b35; } .jps:nth-child(3) .jptt { color: #00e68a; } .jps:nth-child(4) .jptt { color: #06b6d4; }
        .jpd { color: #7a8ba8; font-size: .83rem; line-height: 1.5; padding: 0 .3rem; }

        /* FEATURES */
        .jfg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.3rem; margin-top: 3rem; }
        .jfc { background: #0f1629; border: 1px solid rgba(255,255,255,.06); border-radius: 15px; padding: 1.8rem; transition: all .4s; position: relative; overflow: hidden; }
        .jfc::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; opacity: 0; transition: opacity .4s; }
        .jfc:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.1); background: #151d35; }
        .jfc:hover::before { opacity: 1; }
        .jfc:nth-child(1)::before { background: linear-gradient(90deg, #f5a623, #ff6b35); }
        .jfc:nth-child(2)::before { background: linear-gradient(90deg, #ff6b35, #a855f7); }
        .jfc:nth-child(3)::before { background: linear-gradient(90deg, #00e68a, #06b6d4); }
        .jfc:nth-child(4)::before { background: linear-gradient(90deg, #a855f7, #f5a623); }
        .jfc:nth-child(5)::before { background: linear-gradient(90deg, #06b6d4, #00e68a); }
        .jfc:nth-child(6)::before { background: linear-gradient(90deg, #f5a623, #00e68a); }
        .jfe { font-size: 2.1rem; margin-bottom: .9rem; }
        .jfti { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .9rem; letter-spacing: .4px; margin-bottom: .5rem; }
        .jfde { color: #7a8ba8; font-size: .85rem; line-height: 1.6; }

        /* ECONOMY */
        .jeco { background: linear-gradient(180deg, transparent, rgba(15,22,41,.45), transparent); }
        .jeg { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 3rem; align-items: center; }
        .jer { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .9rem; }
        .jrc { text-align: center; padding: 1.3rem .8rem; border-radius: 11px; background: #0f1629; border: 1px solid rgba(255,255,255,.06); }
        .jrl { font-size: .68rem; color: #4a5873; letter-spacing: 2px; text-transform: uppercase; margin-bottom: .4rem; }
        .jrvl { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .9rem; }
        .jech { display: flex; flex-direction: column; gap: .9rem; }
        .jen { display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.3rem; border-radius: 13px; background: #0f1629; border: 1px solid rgba(255,255,255,.06); transition: all .4s; }
        .jen:hover { border-color: rgba(255,255,255,.1); transform: translateX(5px); }
        .jeni { width: 46px; height: 46px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
        .jen:nth-child(1) .jeni { background: linear-gradient(135deg, rgba(245,166,35,.18), rgba(245,166,35,.04)); }
        .jen:nth-child(2) .jeni { background: linear-gradient(135deg, rgba(255,107,53,.18), rgba(255,107,53,.04)); }
        .jen:nth-child(3) .jeni { background: linear-gradient(135deg, rgba(0,230,138,.18), rgba(0,230,138,.04)); }
        .jen:nth-child(4) .jeni { background: linear-gradient(135deg, rgba(6,182,212,.18), rgba(6,182,212,.04)); }
        .jenn { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .82rem; letter-spacing: .4px; }
        .jenr { font-family: 'Space Mono', monospace; font-size: .75rem; color: #7a8ba8; margin-top: .12rem; }
        .jecc { width: 2px; height: 16px; margin-left: 32px; background: linear-gradient(180deg, #f5a623, #ff6b35, #00e68a); opacity: .25; }

        /* AUTOCLICKERS */
        .jag { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.1rem; margin-top: 3rem; }
        .jac { padding: 1.4rem; border-radius: 13px; background: #0f1629; border: 1px solid rgba(255,255,255,.06); text-align: center; transition: all .4s; position: relative; overflow: hidden; }
        .jac:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.1); }
        .jatr { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .78rem; letter-spacing: 1px; margin-bottom: .2rem; }
        .jac:nth-child(1) .jatr { color: #cd7f32; } .jac:nth-child(2) .jatr { color: #c0c0c0; } .jac:nth-child(3) .jatr { color: #f5a623; } .jac:nth-child(4) .jatr { color: #06b6d4; }
        .jasp { font-family: 'Space Mono', monospace; font-size: 1.9rem; font-weight: 700; margin: .5rem 0; }
        .jac:nth-child(1) .jasp { color: #cd7f32; } .jac:nth-child(2) .jasp { color: #c0c0c0; } .jac:nth-child(3) .jasp { color: #f5a623; } .jac:nth-child(4) .jasp { color: #06b6d4; }
        .jadu { color: #7a8ba8; font-size: .8rem; }
        .jaco { margin-top: .7rem; display: inline-flex; align-items: center; gap: .25rem; padding: .25rem .7rem; border-radius: 5px; background: rgba(245,166,35,.08); color: #f5a623; font-family: 'Space Mono', monospace; font-size: .72rem; }
        .jalb { font-size: .62rem; color: #4a5873; letter-spacing: 1.3px; text-transform: uppercase; margin-top: .5rem; }

        /* PLANETS */
        .jpla { background: linear-gradient(180deg, transparent, rgba(0,230,138,.015), transparent); overflow: hidden; }
        .jplg { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 3rem; align-items: center; }
        .jphg { position: relative; width: 100%; aspect-ratio: 1.25; display: flex; align-items: center; justify-content: center; }
        .jhc { position: relative; width: 310px; height: 290px; }
        .hx { position: absolute; width: 52px; height: 60px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); transition: all .4s; cursor: pointer; }
        .hx:hover { transform: scale(1.14); z-index: 5; }
        .hx.uk { background: rgba(28,38,62,.7); }
        .hx.uk::after { content: '?'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #4a5873; font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .85rem; }
        .hx.hq { background: linear-gradient(135deg, rgba(0,230,138,.5), rgba(0,230,138,.18)); box-shadow: 0 0 18px rgba(0,230,138,.28); }
        .hx.hq::after { content: '🏠'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .hx.et { background: linear-gradient(135deg, rgba(245,166,35,.38), rgba(245,166,35,.08)); }
        .hx.et::after { content: '⚡'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .95rem; }
        .hx.ct { background: linear-gradient(135deg, rgba(168,85,247,.38), rgba(168,85,247,.08)); }
        .hx.ct::after { content: '💎'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .95rem; }
        .jplinfo h3 { font-family: 'Orbitron', sans-serif; font-size: 1.65rem; font-weight: 800; margin-bottom: .9rem; }
        .jplinfo p { color: #7a8ba8; line-height: 1.7; margin-bottom: 1.2rem; font-size: .98rem; }
        .jprw { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
        .jprwi { padding: .9rem; border-radius: 9px; background: #0f1629; border: 1px solid rgba(255,255,255,.06); }
        .jprwl { font-size: .65rem; color: #4a5873; letter-spacing: 1.3px; text-transform: uppercase; }
        .jprwv { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: .92rem; margin-top: .2rem; }
        .jprwi:nth-child(1) .jprwv { color: #ff6b35; } .jprwi:nth-child(2) .jprwv { color: #00e68a; } .jprwi:nth-child(3) .jprwv { color: #a855f7; } .jprwi:nth-child(4) .jprwv { color: #f5a623; }

        /* PROOF */
        .jterm { background: #0b1020; border: 1px solid rgba(255,255,255,.07); border-radius: 13px; overflow: hidden; }
        .jtermh { display: flex; align-items: center; gap: .45rem; padding: .75rem 1.1rem; background: rgba(255,255,255,.025); border-bottom: 1px solid rgba(255,255,255,.04); }
        .jtd { width: 9px; height: 9px; border-radius: 50%; }
        .jtd.r { background: #ff5f57; } .jtd.y { background: #ffbd2e; } .jtd.g { background: #28c840; }
        .jtermh span { font-family: 'Space Mono', monospace; font-size: .68rem; color: #4a5873; margin-left: .4rem; }
        .jtermb { padding: 1.1rem; }
        .jtrow { display: grid; grid-template-columns: 1fr auto auto; gap: .8rem; padding: .65rem 0; border-bottom: 1px solid rgba(255,255,255,.035); align-items: center; font-family: 'Space Mono', monospace; font-size: .75rem; }
        .jtrow:last-child { border: none; }
        .jtamt { color: #00e68a; font-weight: 700; }
        .jtstat { padding: .18rem .55rem; border-radius: 4px; background: rgba(0,230,138,.08); color: #00e68a; font-size: .65rem; }
        .jtdate { color: #4a5873; }
        .jprfg { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 3rem; align-items: start; }
        .jprfi h3 { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: .9rem; }
        .jprfi p { color: #7a8ba8; line-height: 1.7; margin-bottom: 1.3rem; }
        .jprfhl { display: flex; flex-direction: column; gap: .7rem; }
        .jprfh { display: flex; align-items: center; gap: .7rem; padding: .75rem .9rem; border-radius: 9px; background: #0f1629; border: 1px solid rgba(255,255,255,.06); }
        .jprfh span:first-child { font-size: 1.2rem; }
        .jprfh span:last-child { font-size: .87rem; }
        .jprfh strong { color: #00e68a; }

        /* FINAL CTA */
        .jfcta { text-align: center; padding: 8rem 2rem; position: relative; overflow: hidden; }
        .jfcta::before { content: ''; position: absolute; top: 50%; left: 50%; width: 750px; height: 380px; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(ellipse, rgba(0,230,138,.05), rgba(245,166,35,.025), transparent 70%); pointer-events: none; }
        .jfcta h2 { font-family: 'Orbitron', sans-serif; font-size: clamp(1.9rem, 4.8vw, 3.2rem); font-weight: 900; line-height: 1.1; margin-bottom: .9rem; }
        .jfcta p { color: #7a8ba8; font-size: 1.05rem; max-width: 480px; margin: 0 auto 2.2rem; }
        .jfcta .jcp { font-size: .95rem; padding: .95rem 2.8rem; }
        .jvtag { margin-top: 2.2rem; display: inline-flex; align-items: center; gap: .4rem; padding: .45rem 1.3rem; border-radius: 50px; background: rgba(245,166,35,.07); border: 1px solid rgba(245,166,35,.13); font-family: 'Space Mono', monospace; font-size: .7rem; color: #f5a623; letter-spacing: 1.3px; }

        /* FOOTER */
        .jfooter { position: relative; z-index: 1; text-align: center; padding: 1.8rem; border-top: 1px solid rgba(255,255,255,.06); }
        .jfooter p { font-size: .75rem; color: #4a5873; letter-spacing: .8px; }
        .jfooter a { color: #7a8ba8; transition: color .2s; text-decoration: none; }
        .jfooter a:hover { color: #f5a623; }

        @media (max-width: 900px) {
          .jnav-links { display: none; }
          .jpf { grid-template-columns: 1fr 1fr; gap: 1.8rem; } .jpf::before, .jpa { display: none; }
          .jfg { grid-template-columns: 1fr; }
          .jeg, .jplg, .jprfg { grid-template-columns: 1fr; }
          .jag { grid-template-columns: 1fr 1fr; }
          .jhstats { flex-direction: column; gap: .8rem; }
          .jer { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .jpf, .jag { grid-template-columns: 1fr; }
          .join-page section { padding: 4rem 1.2rem; }
          .jprw { grid-template-columns: 1fr; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div className="join-page">
        <canvas ref={canvasRef} id="stars" />

        {/* NAV */}
        <nav className="jnav" id="jnav">
          <a href="https://yieldverse.io" className="jnav-brand">
            <div className="jnav-icon">⚡</div>
            <div><div className="jnav-t">YES METAVERSE</div><div className="jnav-s">YieldVerse Play-to-Earn</div></div>
          </a>
          <div className="jnav-links">
            <a href="#how">How It Works</a>
            <a href="#features">Features</a>
            <a href="#economy">Economy</a>
            <a href="#planets">Planets</a>
            <a href="#proof">Payments</a>
            <a href={REF_URL} className="jbtn-play">▶ PLAY NOW</a>
          </div>
        </nav>

        {/* HERO */}
        <section className="jhero">
          <div className="jbadge"><span className="jdot"></span> Alpha Live — Payouts Active</div>
          <h1>
            <span className="jge">YES</span> METAVERSE<br />
            <span className="jhero-sub">PLAY · EARN · <span className="jgy">CASHOUT</span></span>
          </h1>
          <p className="jhtag">Click to generate energy. Swap to fuel. Explore planets. Earn <strong style={{ color: '#00e68a' }}>real Litecoin</strong>.<br />The YieldVerse metaverse awaits, Pilot.</p>
          <div className="jhctas">
            <a href={REF_URL} className="jcp">⚡ START YOUR EMPIRE</a>
            <a href="#how" className="jcs">↓ DISCOVER HOW</a>
          </div>
          <div className="jhstats">
            <div className="jhs"><div className="jhsv" style={{ color: '#f5a623' }}>263.4K</div><div className="jhsl">Energy Generated</div></div>
            <div className="jhs"><div className="jhsv" style={{ color: '#00e68a' }}>500</div><div className="jhsl">YES Tokens</div></div>
            <div className="jhs"><div className="jhsv" style={{ color: '#b8c4d0' }}>0.203 LTC</div><div className="jhsl">Pool Balance</div></div>
          </div>
          <div className="jhscroll">SCROLL<div className="jchev"></div></div>
        </section>

        {/* HOW IT WORKS */}
        <section className="jpipe" id="how">
          <div className="jcon">
            <div className="rv" style={{ textAlign: 'center' }}>
              <div className="jsl">⚡ The Loop</div>
              <div className="jst">From Click to Crypto in 4 Steps</div>
            </div>
            <div className="jpf">
              <div className="jps rv d1"><div className="jpi">👆</div><span className="jpa">→</span><div className="jptt">GENERATE</div><div className="jpd">Click to produce Energy. Activate autoclickers for passive generation up to +20/s.</div></div>
              <div className="jps rv d2"><div className="jpi">🔄</div><span className="jpa">→</span><div className="jptt">SWAP</div><div className="jpd">Convert 10,000 Energy into 1 Fuel. Fuel is the core resource of the YES economy.</div></div>
              <div className="jps rv d3"><div className="jpi">💎</div><span className="jpa">→</span><div className="jptt">CONVERT</div><div className="jpd">Transform 100 Fuel into 1 YES Token. YES is your cashout currency with real value.</div></div>
              <div className="jps rv d4"><div className="jpi">🏦</div><div className="jptt">CASHOUT</div><div className="jpd">Redeem 100 YES for 0.0001 LTC. Paid instantly to your FaucetPay wallet.</div></div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features">
          <div className="jcon">
            <div className="rv" style={{ textAlign: 'center' }}>
              <div className="jsl">🎮 Game Systems</div>
              <div className="jst">Built for Players, Powered by Crypto</div>
            </div>
            <div className="jfg">
              <div className="jfc rv d1"><div className="jfe">⚡</div><div className="jfti">Energy Generator</div><div className="jfde">Click to produce energy with a +50% boost. Rare resources drop randomly at 25% chance — collect them for bonus rewards.</div></div>
              <div className="jfc rv d2"><div className="jfe">🤖</div><div className="jfti">Autoclickers</div><div className="jfde">4 tiers from Bronze (+2/s) to Platinum (+20/s). Activate with Energy and earn passively while you sleep.</div></div>
              <div className="jfc rv d3"><div className="jfe">🌍</div><div className="jfti">Planet Exploration</div><div className="jfde">Explore hex-grid planets, discover tiles, build your HQ. Energy tiles produce Fuel. Crystal tiles yield YES.</div></div>
              <div className="jfc rv d4"><div className="jfe">💰</div><div className="jfti">Real LTC Payouts</div><div className="jfde">Cash out via FaucetPay with instant processing. Min 100 YES (0.0001 LTC). No tricks, no delays.</div></div>
              <div className="jfc rv d5"><div className="jfe">💜</div><div className="jfti">Rare Resources</div><div className="jfde">Random drops while clicking with legendary variants. Collect rares to unlock exclusive bonuses and planet upgrades.</div></div>
              <div className="jfc rv d1"><div className="jfe">🛡️</div><div className="jfti">Anti-Bot Protection</div><div className="jfde">Fair play enforced with smart captcha. Real players earn, bots get blocked. Your empire is protected.</div></div>
            </div>
          </div>
        </section>

        {/* ECONOMY */}
        <section className="jeco" id="economy">
          <div className="jcon">
            <div className="jeg">
              <div>
                <div className="rv">
                  <div className="jsl">📊 Token Economy</div>
                  <div className="jst">Transparent Rates. Real Value.</div>
                  <p className="jsd" style={{ marginBottom: '1.8rem' }}>Every rate is fixed and verifiable. No hidden fees, no rug pulls — a clean path from energy to earnings.</p>
                </div>
                <div className="jer rv d2">
                  <div className="jrc"><div className="jrl">Swap Rate</div><div className="jrvl" style={{ color: '#f5a623' }}>10K ⚡ → 1 🔥</div></div>
                  <div className="jrc"><div className="jrl">Conversion</div><div className="jrvl" style={{ color: '#ff6b35' }}>100 🔥 → 1 💚</div></div>
                  <div className="jrc"><div className="jrl">Cashout</div><div className="jrvl" style={{ color: '#00e68a' }}>1K 💚 → 0.001 LTC</div></div>
                </div>
              </div>
              <div className="rv d1">
                <div className="jech">
                  <div className="jen"><div className="jeni">⚡</div><div><div className="jenn">Energy</div><div className="jenr">Generated by clicks &amp; autoclickers</div></div></div>
                  <div className="jecc"></div>
                  <div className="jen"><div className="jeni">🔥</div><div><div className="jenn">Fuel</div><div className="jenr">10,000 Energy → 1 Fuel</div></div></div>
                  <div className="jecc"></div>
                  <div className="jen"><div className="jeni">💚</div><div><div className="jenn">YES Token</div><div className="jenr">100 Fuel → 1 YES</div></div></div>
                  <div className="jecc"></div>
                  <div className="jen"><div className="jeni">🪙</div><div><div className="jenn">Litecoin (LTC)</div><div className="jenr">1000 YES → 0.001 LTC via FaucetPay</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AUTOCLICKERS */}
        <section>
          <div className="jcon">
            <div className="rv" style={{ textAlign: 'center' }}>
              <div className="jsl">🤖 Passive Income</div>
              <div className="jst">Autoclickers — Earn While You Sleep</div>
              <p className="jsd" style={{ margin: '0 auto' }}>Higher tiers = more energy/second + longer durations. Stack them for maximum output.</p>
            </div>
            <div className="jag">
              <div className="jac rv d1"><div className="jatr">BRONZE</div><div className="jasp">+2/s</div><div className="jadu">⏱ 30 min</div><div className="jaco">⚡ 500</div><div className="jalb">Starter tier</div></div>
              <div className="jac rv d2"><div className="jatr">SILVER</div><div className="jasp">+5/s</div><div className="jadu">⏱ 2 hours</div><div className="jaco">⚡ 2,000</div><div className="jalb">2.5× efficiency</div></div>
              <div className="jac rv d3"><div className="jatr">GOLD</div><div className="jasp">+10/s</div><div className="jadu">⏱ 8 hours</div><div className="jaco">⚡ 10,000</div><div className="jalb">Overnight power</div></div>
              <div className="jac rv d4"><div className="jatr">PLATINUM</div><div className="jasp">+20/s</div><div className="jadu">⏱ 24 hours</div><div className="jaco">🔥 1 Fuel</div><div className="jalb">Ultimate tier</div></div>
            </div>
          </div>
        </section>

        {/* PLANETS */}
        <section className="jpla" id="planets">
          <div className="jcon">
            <div className="jplg">
              <div className="jphg rv"><div className="jhc" id="hexGrid"></div></div>
              <div className="jplinfo rv d2">
                <div className="jsl">🌍 YieldVerse</div>
                <h3>Explore. Discover. Conquer.</h3>
                <p>Each planet is a procedurally generated hex-grid world. Build your HQ, discover Energy tiles for daily Fuel, Crystal tiles for YES tokens, and unearth legendary Artifacts.</p>
                <p>Your first planet — <strong style={{ color: '#a855f7' }}>Nexus-Prime-OMEGA</strong> (Legendary) — is waiting.</p>
                <div className="jprw">
                  <div className="jprwi"><div className="jprwl">Energy Tiles</div><div className="jprwv">+8 Fuel/day</div></div>
                  <div className="jprwi"><div className="jprwl">Crystal Tiles</div><div className="jprwv">+YES/day</div></div>
                  <div className="jprwi"><div className="jprwl">Artifacts</div><div className="jprwv">Legendary loot</div></div>
                  <div className="jprwi"><div className="jprwl">Factory Tiles</div><div className="jprwv">+Fuel/day</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROOF */}
        <section id="proof">
          <div className="jcon">
            <div className="jprfg">
              <div className="rv">
                <div className="jterm">
                  <div className="jtermh">
                    <span className="jtd r"></span><span className="jtd y"></span><span className="jtd g"></span>
                    <span>faucetpay_transactions.log</span>
                  </div>
                  <div className="jtermb">
                    <div className="jtrow"><span>Yieldverse</span><span className="jtamt">0.00083333 LTC</span><span className="jtstat">✓ Paid</span></div>
                    <div className="jtrow"><span>Yieldverse</span><span className="jtamt">0.00010000 LTC</span><span className="jtstat">✓ Paid</span></div>
                    <div className="jtrow"><span>Yieldverse</span><span className="jtamt">0.00010000 LTC</span><span className="jtstat">✓ Paid</span></div>
                    <div className="jtrow" style={{ border: 'none' }}><span className="jtdate">1st February 2026</span><span></span><span className="jtdate">via FaucetPay</span></div>
                  </div>
                </div>
              </div>
              <div className="jprfi rv d2">
                <div className="jsl">💸 Real Payouts</div>
                <h3>We Pay. For Real.</h3>
                <p>No empty promises. Every cashout processed instantly through FaucetPay to your Litecoin wallet. Real transactions, real dates, real crypto.</p>
                <div className="jprfhl">
                  <div className="jprfh"><span>⚡</span><span><strong>Instant</strong> processing via FaucetPay</span></div>
                  <div className="jprfh"><span>🔒</span><span>Pool: <strong>0.2031 LTC</strong> available</span></div>
                  <div className="jprfh"><span>✅</span><span>Min: <strong>100 YES</strong> (0.0001 LTC)</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="jfcta rv">
          <h2>Your <span style={{ color: '#f5a623' }}>Empire</span> Awaits,<br />Pilot.</h2>
          <p>Join the YES Metaverse. Click, build, explore, and cash out real Litecoin. The adventure starts now.</p>
          <a href={REF_URL} className="jcp">⚡ LAUNCH YES METAVERSE</a>
          <div><div className="jvtag">⚡ ALPHA VERSION — Early adopters earn the most ⚡</div></div>
        </section>

        <footer className="jfooter">
          <p>© 2026 <a href="https://yieldverse.io">YieldVerse</a> — YES Metaverse · Built with ⚡</p>
          <p style={{marginTop:'0.5rem'}}><a href="https://x.com/Crypto_FarmerX" target="_blank" rel="noopener noreferrer">🐦 X</a> · <a href="https://www.facebook.com/profile.php?id=61586569664260" target="_blank" rel="noopener noreferrer">📘 Facebook</a></p>
        </footer>
      </div>
    </>
  )
}

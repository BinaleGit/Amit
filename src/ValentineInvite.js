import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './ValentineInvite.css';

const ValentineInvite = () => {
  // מצבים (States)
  const [hasStarted, setHasStarted] = useState(false); // האם לחצה על "התחל"
  const [introIndex, setIntroIndex] = useState(-1); // איזה טקסט מציגים כרגע (-1 זה לפני ההתחלה)
  const [showEnvelope, setShowEnvelope] = useState(false); // האם להציג את המעטפה
  
  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [noBtnStyle, setNoBtnStyle] = useState({});
  const [runAwayCount, setRunAwayCount] = useState(0);
  
  // משתנים לאפקט תלת מימד
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // --- הטקסטים של האינטרו ---
  const introLines = [
    "חשבתי הרבה זמן איך לעשות את זה... ולא ידעתי איך!",
    "אחרי הרבה מחשבה הגעתי למסקנה שזה הכי אישי, מקורי ומגניב",
    "חשבתי אפילו איך אני אכרע ברך... 💍",
    "סתם מה את משוגעת? \n(שאלה רטורית)\nזה עוד לא הזמן...",
    "חיפשתי את הדרך הכי טובה להראות לך כמה את חשובה לי", // שדרוג ניסוח
    "אז הנה, שימי ❤️",
    "זה במיוחד בשבילך ✨" // מסך אחרון לפני המעטפה
  ];


  
  const musicRef = useRef(new Audio(`${process.env.PUBLIC_URL || ''}/song.mp3`));

  // --- ניהול רצף האינטרו (טיימינג איטי יותר) ---
  useEffect(() => {
    if (hasStarted && introIndex < introLines.length) {
      // שיניתי ל-5500 (5.5 שניות) לכל משפט כדי שיהיה זמן לקרוא בנחת
      const timer = setTimeout(() => {
        setIntroIndex(prev => prev + 1);
      }, 5500);
      return () => clearTimeout(timer);
    } else if (hasStarted && introIndex === introLines.length) {
      // סיום האינטרו
      setShowEnvelope(true);
    }
  }, [hasStarted, introIndex, introLines.length]);

  // --- פונקציית התחלה (Start) ---
  const handleStart = () => {
    const audio = musicRef.current;
    audio.volume = 0; 
    audio.loop = true; 
    
    // ניגון מוזיקה וכניסה ללופ הטקסטים
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        let vol = 0;
        const fadeInterval = setInterval(() => {
          if (vol < 0.8) { 
            vol += 0.05;
            audio.volume = parseFloat(vol.toFixed(2));
          } else {
            clearInterval(fadeInterval);
          }
        }, 200);
      }).catch(err => console.log("Audio error:", err));
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      ctx.resume();
    }

    setHasStarted(true);
    setIntroIndex(0); // מתחיל את הטקסט הראשון
  };

  // --- פונקציות קיימות (כפתורים וסאונד) ---
  const getNoButtonText = () => {
    if (runAwayCount === 0) return "...לא";
    const messages = ["לא יפה עמית", "מצחיק!", "תשמעי אין לך ברירה", "נו מה"];
    const index = (runAwayCount - 1) % messages.length;
    return messages[index];
  };

  const playPopSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  };

  const playFileSound = (fileName) => {
    const audio = new Audio(`${process.env.PUBLIC_URL || ''}/sounds/${fileName}`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const handleMouseMove = (e) => {
    if (isOpen) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const xTilt = (clientY - innerHeight / 2) / 15;
    const yTilt = (clientX - innerWidth / 2) / 15;
    const xPct = (clientX / innerWidth) * 100;
    const yPct = (clientY / innerHeight) * 100;
    setTilt({ x: xTilt, y: yTilt });
    setMousePos({ x: xPct, y: yPct });
  };

  const moveButton = () => {
    playPopSound();
    const x = Math.random() * 180 - 90;
    const y = Math.random() * 80 - 40; 
    setNoBtnStyle({ 
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    setRunAwayCount(prev => prev + 1);
  };

  const handleOpen = () => {
    if (isOpen) return;
    playFileSound('open.mp3');
    setIsOpen(true);
    setTilt({ x: 0, y: 0 }); 
  };

  const handleAccept = () => {
    playFileSound('yay.mp3');
    setIsAccepted(true);
    triggerConfetti();
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff1744', '#ffffff', '#ff8a80'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff1744', '#ffffff', '#ff8a80'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <div className="container" onMouseMove={handleMouseMove}>
      
      {/* 1. מסך התחלה סטטי (לחיצה ראשונה) */}
      {!hasStarted && (
        <div className="intro-screen start-btn-cursor" onClick={handleStart}>
          <div className="intro-content">
            <h1 className="intro-title">עמית, הכנתי לך משהו...</h1>
            <p className="intro-subtitle">תלחצי כדי לגלות ✨</p>
            <p className="music-hint"> (תגבירי את הרמקולים) 🎵</p>
          </div>
        </div>
      )}

      {/* 2. רצף הטקסטים (Storytelling) */}
      {hasStarted && !showEnvelope && (
        <div className="intro-screen">
          <div className="story-text-container">
            {introLines.map((line, index) => (
              <h2 
                key={index}
                className={`story-text ${index === introIndex ? 'visible' : ''}`}
              >
                {line}
              </h2>
            ))}
          </div>
        </div>
      )}

      {/* 3. המעטפה (האפליקציה הראשית) */}
      {showEnvelope && (
        <>
          <div className="floating-bg">
            {[...Array(10)].map((_, i) => <span key={i}>❤️</span>)}
          </div>

          {isAccepted ? (
            <div className="success-screen">
              <h1 className="glow-text">יששש! 😍</h1>
              <p className="subtitle-glow">ידעתי שתסכימי!</p>
              <div className="heart-beat-final">💖</div>
              <div className="ticket-stub">
                <p>שמרתי לנו מקום</p>
                <h3>תיהיי מוכנה</h3>
                <p>14.02 | 19:00</p>
              </div>
            </div>
          ) : (
            <div className="entrance-anim perspective-container">
              <div 
                className={`envelope-wrapper ${isOpen ? 'open' : ''}`} 
                onClick={handleOpen}
                style={{ 
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  '--mouse-x': `${mousePos.x}%`,
                  '--mouse-y': `${mousePos.y}%`
                }}
              >
                <div className="envelope-back"></div>

                <div className="card glass-effect">
                  <div className="card-shine"></div>
                  <div className="card-content">
                    <div className="card-header">
                      <h2>הזמנה לערב רומנטי 🥂</h2>
                    </div>
                    
                    <div className="floating-content">
                      <div className="menu-list">
                        <div className="menu-item">
                          <span className="label">מנה ראשונה:</span>
                          <span className="value">דייט עם האישה הכי יפה בעולם</span>
                        </div>
                        <div className="menu-item">
                          <span className="label">מנה עיקרית:</span>
                          <span className="value">מקום סודי!</span>
                        </div>
                        <div className="menu-item">
                          <span className="label">לקינוח:</span>
                          <span className="value">ערב בלתי נשכח ביחד</span>
                        </div>
                      </div>

                      <div className="divider-line"></div>
                      
                      <div className="date-display">
                        <span>14.02.2026</span> • <span>19:00</span>
                      </div>

                      <p className="question-text">האם תרצי להיות הוולנטיין שלי?</p>
                    </div>
                    
                    <div className="buttons-container">
                      <button className="btn yes-btn" onClick={(e) => { e.stopPropagation(); handleAccept(); }}>
                        כן! 😍
                      </button>
                      <button 
                        className="btn no-btn" 
                        style={noBtnStyle}
                        onMouseEnter={moveButton} 
                        onTouchStart={moveButton}
                        onClick={(e) => e.stopPropagation()} 
                      >
                        {getNoButtonText()}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="envelope-front"></div>
                <div className="envelope-flap"></div>
                
                
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ValentineInvite;
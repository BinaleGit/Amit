import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './ValentineInvite.css';

// --- רכיב כרטיס גירוד ---
// הוספנו ID כדי לזהות איזה כרטיס גורד
const ScratchCard = ({ id, children, onReveal }) => {
  const canvasRef = useRef(null);
  const [hasNotified, setHasNotified] = useState(false); // כדי להודיע לאבא רק פעם אחת

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;

    // שכבת ציפוי
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, width, height);
    
    // טקסט
    ctx.fillStyle = '#666';
    ctx.font = 'bold 16px Assistant';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('גרדי אותי ✨', width / 2, height / 2);

    ctx.globalCompositeOperation = 'destination-out';
  }, []);

  // בדיקת כמה נחשף מהכרטיס
  const checkReveal = (ctx, width, height) => {
    if (hasNotified) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let clearPixels = 0;
    const step = 40; 
    
    for (let i = 3; i < data.length; i += step) {
      if (data[i] === 0) clearPixels++;
    }
    
    const totalSampled = data.length / step;
    const percentage = (clearPixels / totalSampled) * 100;

    // ברגע שגירדה 50% מהכרטיס, המערכת רושמת שזה "בוצע"
    // אבל הציפוי נשאר! הוא לא נעלם לבד.
    if (percentage > 50) {
      setHasNotified(true);
      if (onReveal) onReveal(id);
    }
  };

  const handleScratch = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if (e.type.includes('touch')) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    if (!hasNotified && Math.random() > 0.8) {
      checkReveal(ctx, canvas.width, canvas.height);
    }
  };

  return (
    <div className="scratch-card-wrapper">
      <div className="hidden-content">{children}</div>
      {/* הורדנו את ה-Class שמעלים את הקנבס. הוא נשאר תמיד. */}
      <canvas 
        ref={canvasRef}
        className="scratch-canvas"
        onMouseMove={handleScratch}
        onTouchMove={handleScratch}
      />
    </div>
  );
};

const ValentineInvite = () => {
  const lastMoveTime = useRef(0); // משתנה לשמירת הזמן של התזוזה האחרונה
  const [hasStarted, setHasStarted] = useState(false);
  const [introIndex, setIntroIndex] = useState(-1);
  const [showEnvelope, setShowEnvelope] = useState(false);
  
  const [isLocked, setIsLocked] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [shakeLock, setShakeLock] = useState(false);
  const [lockAnim, setLockAnim] = useState('idle');

  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [noBtnStyle, setNoBtnStyle] = useState({});
  const [runAwayCount, setRunAwayCount] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // --- מעקב אחרי כרטיסים (לפי מזהה ייחודי לכל אחד) ---
  const [, setScratchedCards] = useState({
    card1: false,
    card2: false,
    card3: false
  });
  const [showFooter, setShowFooter] = useState(false);

  const SECRET_CODE = "2901"; 
  const musicRef = useRef(new Audio(`${process.env.PUBLIC_URL || ''}/song.mp3`));

  const introLines = [
    "חשבתי הרבה זמן איך לעשות את זה... ולא ידעתי איך!",
    "אחרי הרבה מחשבה הגעתי למסקנה שזה הכי אישי, מקורי ומגניב",
    "חשבתי אפילו איך אני אכרע ברך... 💍",
    "סתם מה את משוגעת? \n(שאלה רטורית)\nזה עוד לא הזמן...",
    "חיפשתי את הדרך הכי טובה להראות לך כמה את חשובה לי",
    "אז הנה, שימי ❤️",
    "זה במיוחד בשבילך ✨"
  ];

  useEffect(() => {
    if (hasStarted && introIndex < introLines.length) {
      const timer = setTimeout(() => {
        setIntroIndex(prev => prev + 1);
      }, 5500);
      return () => clearTimeout(timer);
    } else if (hasStarted && introIndex === introLines.length) {
      setShowEnvelope(true);
    }
  }, [hasStarted, introIndex, introLines.length]);

  // פונקציה שמעדכנת שכרטיס ספציפי גורד
  const handleCardReveal = (id) => {
    setScratchedCards(prev => {
      const newState = { ...prev, [id]: true };
      
      // בדיקה אם *כל* הערכים הם true
      const allDone = Object.values(newState).every(val => val === true);
      
      if (allDone) {
        setTimeout(() => {
          setShowFooter(true);
        }, 1000);
      }
      return newState;
    });
  };

  const handleKeypadPress = (val) => {
    if (val === 'DEL') { setInputCode(prev => prev.slice(0, -1)); return; }
    if (inputCode.length < 4) {
      const newCode = inputCode + val;
      setInputCode(newCode);
      if (newCode.length === 4) {
        if (newCode === SECRET_CODE) {
          setShowKeypad(false);
          setLockAnim('breaking'); 
          setTimeout(() => {
            setIsLocked(false);
            handleOpen(true);
          }, 2000); 
        } else {
          setTimeout(() => {
            setShakeLock(true);
            setInputCode("");
            setTimeout(() => setShakeLock(false), 500);
          }, 300);
        }
      }
    }
  };

  const handleStart = () => {
    const audio = musicRef.current;
    audio.volume = 0; audio.loop = true; 
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        let vol = 0;
        const fadeInterval = setInterval(() => {
          if (vol < 0.8) { vol += 0.05; audio.volume = parseFloat(vol.toFixed(2)); } 
          else { clearInterval(fadeInterval); }
        }, 200);
      }).catch(() => {});
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) { (new AudioContext()).resume(); }
    setHasStarted(true);
    setIntroIndex(0);
  };

  const getNoButtonText = () => {
    if (runAwayCount === 0) return "...לא";
    const messages = ["לא יפה עמית", "מצחיק!", "תשמעי אין לך ברירה", "נו מה"];
    return messages[(runAwayCount - 1) % messages.length];
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
    const now = Date.now();
    // אם עברו פחות מ-400 מילישניות מאז התזוזה האחרונה - אל תעשה כלום
    if (now - lastMoveTime.current < 400) return;

    lastMoveTime.current = now; // מעדכן את הזמן האחרון

    // מכאן זה הקוד הרגיל שהיה לך
    const x = Math.random() * 140 - 70;
    const y = Math.random() * 60 - 30; 
    setNoBtnStyle({ 
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    setRunAwayCount(prev => prev + 1);
  };

  const handleEnvelopeClick = () => {
    if (isOpen) return;
    if (isLocked) setShowKeypad(true);
    else handleOpen();
  };

  const handleOpen = (force = false) => {
    if (isOpen && !force) return;
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
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff1744', '#ffffff'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff1744', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <div className="container" onMouseMove={handleMouseMove}>
      {!hasStarted && (
        <div className="intro-screen start-btn-cursor" onClick={handleStart}>
          <div className="intro-content">
            <h1 className="intro-title">עמית, הכנתי לך משהו...</h1>
            <p className="intro-subtitle">תלחצי כדי לגלות ✨</p>
            <p className="music-hint"> (תגבירי את הרמקולים) 🎵</p>
          </div>
        </div>
      )}

      {hasStarted && !showEnvelope && (
        <div className="intro-screen">
          <div className="story-text-container">
            {introLines.map((line, index) => (
              <h2 key={index} className={`story-text ${index === introIndex ? 'visible' : ''}`}>
                {line}
              </h2>
            ))}
          </div>
        </div>
      )}

      {showEnvelope && (
        <>
          {showKeypad && (
            <div className="keypad-overlay">
              <div className={`keypad-box ${shakeLock ? 'shake' : ''}`}>
                <h3>🔒 הקלידי קוד סודי</h3>
                <p className="hint-text">(רמז: התאריך שלנו)</p>
                <div className="code-display">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className={i < inputCode.length ? 'filled' : ''}>
                      {i < inputCode.length ? '•' : '◦'}
                    </span>
                  ))}
                </div>
                <div className="keys-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handleKeypadPress(num)}>{num}</button>
                  ))}
                  <div className="empty-space"></div>
                  <button className="zero-btn" onClick={() => handleKeypadPress(0)}>0</button>
                  <button className="del-btn" onClick={() => handleKeypadPress('DEL')}>⌫</button> 
                </div>
                <button className="cancel-btn" onClick={() => setShowKeypad(false)}>ביטול</button>
              </div>
            </div>
          )}

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
                onClick={handleEnvelopeClick}
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
                    
                    <div className="floating-content menu-scroll-container">
                      <div className="menu-list">
                        <div className="menu-item">
                          <span className="label">מנה ראשונה:</span>
                          <ScratchCard id="card1" onReveal={handleCardReveal}>
                            <span className="value">דייט עם האישה הכי יפה בעולם</span>
                          </ScratchCard>
                        </div>
                        <div className="menu-item">
                          <span className="label">מנה עיקרית:</span>
                          <ScratchCard id="card2" onReveal={handleCardReveal}>
                            <span className="value">מקום סודי!</span>
                          </ScratchCard>
                        </div>
                        <div className="menu-item">
                          <span className="label">לקינוח:</span>
                          <ScratchCard id="card3" onReveal={handleCardReveal}>
                            <span className="value">ערב בלתי נשכח ביחד</span>
                          </ScratchCard>
                        </div>
                      </div>

                      <div className="divider-line"></div>
                      
                      {/* --- חלק תחתון: מוסתר עד שכל ה-3 נחשפו --- */}
                      <div className={`footer-section ${showFooter ? 'visible' : ''}`}>
                        <div className="date-display"><span>14.02.2026</span> • <span>19:00</span></div>
                        <p className="question-text">האם תרצי להיות הוולנטיין שלי?</p>
                        
                        <div className="buttons-container">
                          <button className="btn yes-btn" onClick={(e) => { e.stopPropagation(); handleAccept(); }}>כן! 😍</button>
                          <button className="btn no-btn" style={noBtnStyle} onMouseEnter={moveButton} onTouchStart={moveButton} onClick={(e) => e.stopPropagation()}>{getNoButtonText()}</button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="envelope-front"></div>
                <div className="envelope-flap"></div>
                {!isOpen && isLocked && (
                  <div className={`center-lock ${lockAnim === 'breaking' ? 'breaking-anim' : ''}`}>🔒</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ValentineInvite;
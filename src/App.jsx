import "./App.css";
import styles from "./styles/landing.module.css";
import tagIcon from "../public/forks.png"
import outlineFork from "../public/outline_fork.png";
import star from "../public/star.svg";
import heroImg from "../public/heroImg.svg";
import Selection from "../public/selection.png";
import aymene from "../public/aymene.png";
import anastasia from "../public/anastasia.png";
import shakhzod from "../public/shakhzod.png";
import whiteLogo from "../public/whiteLogo.png";

function App() {
  const handleGetStarted = () => {
    window.location.href = "/auth/sign-up";
  };

  const handleLearnMore = () => {
    const whyChooseSection = document.getElementById("why-choose-section");
    if (whyChooseSection) {
      whyChooseSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubscribe = () => {
    alert("Thank you for subscribing!");
  };

  return (
    <>
    <div className={styles.landingContainer}>
        <div className={styles.heroSection}>
          <div className={styles.left}>
            <div className={styles.tag}>
                <div className={styles.tagIcon}>
                  <img src={tagIcon || "/placeholder.svg"} alt="tag icon" />
                </div>

                <div className={styles.tagText}>
                  <p className={styles.tagFirst}>Radically New</p>
                  <p className={styles.tagSecond}>Read Our <span>Success Story</span></p>
                </div>
            </div> 

            <div className = {styles.heroText}>
              <h1 className={styles.heroMainText}>
                Save Time and <span>Boost Health</span>
              </h1>

              <p className={styles.heroSubText}>
                Community-Approved Recipes You Can Trust
              </p>
            </div> 

            <div className={styles.heroButtons}>
              <button 
                className={styles.heroMainBtn}
                onClick={handleGetStarted}
              >
                Get Started
              </button>
              <button 
                className={styles.heroSecondaryBtn}
                onClick={handleLearnMore}
              >
                Learn More
              </button>
            </div>

            <div className={styles.stats}>
              <div className={styles.statsLeft}>
                <div className={styles.leftStatIcon}>
                  <img src={outlineFork || "/placeholder.svg"} alt="fork icon" />
                </div>

                <div className={styles.leftStatText}>
                  <p>Ready to go <span>100+</span></p>
                  <p>Recipes</p>
                </div>
              </div>

              <div className={styles.statsLine}></div>

              <div className={styles.statsRight}>
                  <div className={styles.rightStatIcon}>
                    <img src={star || "/placeholder.svg"} alt="star icon" />
                  </div>
                  <p>3.7</p>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <img src={heroImg || "/placeholder.svg"} alt="hero" />
          </div>
        </div>

        <h1 className={styles.sectionTitle}>One Place For <br></br> <span>Thousands</span> Recipes</h1>

        <div className={styles.selectionImg}>
          <img src={Selection || "/placeholder.svg"} alt="selection" />
        </div>
        <p className={styles.sectionTag}>Top 3 Reasons</p>
        <h1 className={styles.sectionTitle} id="why-choose-section">Why Choose</h1>

        <div className={styles.options}>
          <div className={styles.outlineOption}>
            <h2>Time Saving</h2>
            <p>Student or a worker with hectic schedule, don`t worry we got you</p>
          </div>

          <div className={styles.fillOption}>
            <h2>Healthy Recipes</h2>
            <p>Food that does not harm you, instead makes you better</p>
          </div>

          <div className={styles.outlineOption}>
            <h2>Quick & Easy Cooking</h2>
            <p>Selection of recipes that even 6 year old can follow</p>
          </div>
        </div>

        <p className={styles.sectionTag}>Masterminds behind</p>
        <h1 className={styles.sectionTitle}>Meet <span>Our Team</span></h1>

        <div className={styles.team}>
          <img src={aymene || "/placeholder.svg"} alt="aymene" />
          <img src={anastasia || "/placeholder.svg"} alt="anastasia" />
          <img src={shakhzod || "/placeholder.svg"} alt="shakhzod" />
        </div>

      <div className={styles.newsLetterContainer}>
        <div className={styles.newsLetter}>
          <h1>Join Our News Letter to recieve great offers and news exclusively from us</h1>
          <div className={styles.newsLetterBottom}>
            <input type="email" placeholder="your@email.com"/>

            <button 
              className={styles.newsLetterBtn}
              onClick={handleSubscribe}
            >
              Subscribe
            </button>
          </div>
        </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLogo}>
            <img src={whiteLogo || "/placeholder.svg"} alt="logo" />
          </div>

          <div className={styles.footerText}>
            <p>Developed by Nova</p>
            <p>© 2025 SafeBites, All Rights Reserved</p>
          </div>
        </div>
    </div>
    </>
  );
}

export default App;
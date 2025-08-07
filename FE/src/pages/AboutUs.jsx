import Component9 from "../components/Component9";
import Component1 from "../components/Component1";
import Component2 from "../components/Component2";
import Component6 from "../components/Component6";
import Component7 from "../components/Component7";
import Component8 from "../components/Component8";
const AboutUs = () => {
  return (
    <main className="aboutus-main">
      <section className="aboutus-intro-section animate-fade-in">
        <Component9 />
      </section>
      <section className="aboutus-partner-section animate-fade-in">
        <Component1 />
      </section>
      <section className="aboutus-benefit-section animate-fade-in">
        <Component2 />
      </section>
      <section className="aboutus-testimonial-section animate-fade-in">
        <Component6 />
      </section>
      <section className="aboutus-faq-section animate-fade-in">
        <Component7 />
      </section>
      <section className="aboutus-cta-section animate-fade-in">
        <Component8 />
      </section>
    </main>
  );
};

export default AboutUs;

import Banner from "../components/Banner";
import Component1 from "../components/Component1";
import Component2 from "../components/Component2";
import Component3 from "../components/Component3";
import Component4 from "../components/Component4";
import Component5 from "../components/Component5";
import Component6 from "../components/Component6";
import Component7 from "../components/Component7";
import Component8 from "../components/Component8";
const Home = () => {
  return (
    <main className="home-main">
      <section className="home-hero-section">
        <Banner />
      </section>
      <section className="home-partner-section">
        <Component1 />
      </section>
      <section className="home-benefit-section">
        <Component3 />
      </section>
      <section className="home-career-section">
        <Component2 />
      </section>
      <section className="home-courses-section">
        <Component4 />
      </section>
      <section className="home-testimonial-section">
        <Component6 />
      </section>
      <section className="home-faq-section">
        <Component7 />
      </section>
      <section className="home-cta-section">
        <Component8 />
      </section>
    </main>
  );
};
export default Home;

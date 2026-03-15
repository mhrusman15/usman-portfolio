import { MdCopyright } from "react-icons/md";
import { FaGithub, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href="mailto:musmannawaz007@gmail.com" data-cursor="disable">
                musmannawaz007@gmail.com
              </a>
            </p>
            <h4>Phone</h4>
            <p>
              <a href="tel:+923058007000" data-cursor="disable">
                +92 305 8007000
              </a>
            </p>
            <h4>Location</h4>
            <p>Lahore, Pakistan</p>
            <h4>Education</h4>
            <p>BS Computer Science, Superior University Gold Campus (2020 – 2024)</p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <div className="contact-social-logos">
              <a
                href="https://github.com/mhrusman15"
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
                className="contact-social-icon"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.linkedin.com/in/muhammad-usman-software-engr/"
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
                className="contact-social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
              <a
                href="https://www.instagram.com/mhrusman15"
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
                className="contact-social-icon"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Muhammad Usman</span>
            </h2>
            <h5>
              <MdCopyright /> 2025
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

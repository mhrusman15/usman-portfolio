import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Software Engineering Intern</h4>
                <h5>King Revolution | Lahore</h5>
              </div>
              <h3>April 2024 – Present</h3>
            </div>
            <p>
              Assisting in the development and maintenance of web applications.
              Supporting frontend development using HTML, CSS, and JavaScript.
              Implementing new features based on project requirements. Debugging
              and fixing application issues. Collaborating with senior developers
              on ongoing projects. Testing features before deployment to ensure
              proper functionality.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>IT Support Executive</h4>
                <h5>Allied Rental Services Limited | Lahore</h5>
              </div>
              <h3>Nov 2023 – April 2024</h3>
            </div>
            <p>
              Provided technical support for hardware, software, and network
              issues. Diagnosed and resolved system and application errors.
              Installed and configured operating systems and applications.
              Monitored system performance and conducted routine maintenance.
              Managed user accounts, access permissions, and password resets.
              Coordinated with internal teams to troubleshoot complex technical
              problems.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>BS Computer Science</h4>
                <h5>Superior University Gold Campus, Lahore</h5>
              </div>
              <h3>2020 – 2024</h3>
            </div>
            <p>
              <strong>Courses:</strong> Programming Fundamentals, Object-Oriented
              Programming, Data Structures &amp; Algorithms, Database Systems,
              Web Technologies, Computer Networks, Software Engineering, Advanced
              Web &amp; Mobile Application Development, Artificial Intelligence,
              Machine Learning, Image Processing, Data Science, Theory of Automata,
              Compiler Construction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;

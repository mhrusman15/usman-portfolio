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
                <h4>IT Support Executive</h4>
                <h5>Allied Rental Services Limited | Lahore</h5>
              </div>
              <h3>April 2024 – Present</h3>
            </div>
            <p>
              Providing technical support for hardware, software, and network
              issues. Diagnosing and resolving system and application errors.
              Installing and configuring operating systems and applications.
              Monitoring system performance and conducting routine maintenance.
              Managing user accounts, access permissions, and password resets.
              Coordinating with internal teams to troubleshoot technical
              problems.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Software Engineering Intern</h4>
                <h5>King Revolution | Lahore</h5>
              </div>
              <h3>Nov 2023 – April 2024</h3>
            </div>
            <p>
              Assisted in the development and maintenance of web applications.
              Supported frontend development using HTML, CSS, and JavaScript.
              Implemented new features based on project requirements. Debugged
              and fixed application issues. Collaborated with senior developers
              on ongoing projects. Tested features before deployment to ensure
              proper functionality.
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

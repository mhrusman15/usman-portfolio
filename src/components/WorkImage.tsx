import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");
  const [imgError, setImgError] = useState(false);
  const handleMouseEnter = () => {
    if (props.video) {
      setIsVideo(true);
      setVideo(props.video);
    }
  };

  const showPlaceholder = !props.image || imgError;
  const content = (
    <>
      {props.link && (
        <div className="work-link">
          <MdArrowOutward />
        </div>
      )}
      {showPlaceholder ? (
        <div className="work-image-placeholder" aria-hidden>
          <span>{props.alt ? props.alt.charAt(0) : "?"}</span>
        </div>
      ) : (
        <img
          src={props.image}
          alt={props.alt ?? "Project"}
          onError={() => setImgError(true)}
        />
      )}
      {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
    </>
  );

  return (
    <div className="work-image">
      {props.link ? (
        <a
          className="work-image-in"
          href={props.link}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVideo(false)}
          target="_blank"
          rel="noreferrer"
          data-cursor="disable"
        >
          {content}
        </a>
      ) : (
        <div className="work-image-in" onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsVideo(false)}>
          {content}
        </div>
      )}
    </div>
  );
};

export default WorkImage;

open ReasonMediaDevices;

let getMediaStream = () => {
  MediaDevices.getUserMedia(
    Bool,
    Constraint,
    {
      audio: true,
      video:
        Constraints.Video.make(
          ~facingMode=(
            Array,
            {ideal: Some([|"user", "environment"|]), exact: None},
          ),
          (),
        ),
    },
  );
};

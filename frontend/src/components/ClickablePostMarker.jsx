import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const createAvatarWithCircleIcon = ({ imageUrl, size = 40, backgroundColor = 'blue' }) => {
  const circleSize = size;

  const html = `
    <style>
      .custom-marker {
        transition: transform 0.2s ease;
      }
      .custom-marker:hover {
        transform: scale(1.15);
        z-index: 1000; /* ensure it pops above others */
      }
    </style>
    <div class="custom-marker" style="
      width: ${circleSize}px;
      height: ${circleSize}px;
      background-color: ${backgroundColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      ${imageUrl ? `<img 
        src="${imageUrl}" 
        style="
            width: ${circleSize * 0.8}px;
            height: ${circleSize * 0.8}px;
            border-radius: 50%;
            object-fit: cover;
        " />` : ''}
    </div>
  `;

  return L.divIcon({
    className: '', // prevent default styles
    html,
    iconSize: [circleSize, circleSize],
    iconAnchor: [circleSize / 2, circleSize],
    popupAnchor: [0, -circleSize],
  });
};

const ClickablePostMarker = ({ post, onClick, size, backgroundColor }) => {
  const handleMarkerClick = () => {
    onClick(post);
  };

  const icon = createAvatarWithCircleIcon({
    imageUrl: post?.user?.avatar_url,
    size: size || 40,
    backgroundColor: backgroundColor || 'blue',
  });

  return (
    <Marker
      key={post.id}
      position={[post.location.latitude, post.location.longitude]}
      eventHandlers={{ click: handleMarkerClick }}
      icon={icon}
    >
        <Tooltip direction="top" offset={[0, -size / 2 || -20]} opacity={1} permanent={false}>
            <div style={{ textAlign: 'center' }}>
            <div>@{post?.user?.username}</div>
            <div>{post?.location?.name}</div>
            </div>
        </Tooltip>

    </Marker>
  );
};

export default ClickablePostMarker;

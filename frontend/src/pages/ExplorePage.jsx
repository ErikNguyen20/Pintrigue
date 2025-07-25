import { Button, Box, VStack, Flex, Container, useDialog } from "@chakra-ui/react";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "../components/Navbar";

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useMemo, useRef, useEffect } from "react";
import { useNearbyPostsAPI } from "../utils/api_methods";

import ClickablePostMarker from "../components/ClickablePostMarker";
import PostDialog from "../components/PostDialog";
import { debounce } from 'lodash';
import { useSearchParams } from "react-router-dom";


const MapUpdater = ({ setMapState }) => {
  const debouncedSetMapState = useRef(
    debounce((newState) => {
      setMapState(newState);
    }, 300)
  ).current;

  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      const zoom = map.getZoom();
      debouncedSetMapState({
        latitude: center.lat,
        longitude: center.lng,
        zoom,
      });
    },
    zoomend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      const zoom = map.getZoom();
      debouncedSetMapState({
        latitude: center.lat,
        longitude: center.lng,
        zoom,
      });
    },
  });

  useEffect(() => {
    return () => {
      debouncedSetMapState.cancel();
    };
  }, [debouncedSetMapState]);

  return null;
};


const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultLat = parseFloat(searchParams.get("lat")) || 40.889942;
  const defaultLng = parseFloat(searchParams.get("lng")) || -103.9560727;
  const defaultZoom = parseInt(searchParams.get("zoom")) || 5;

  const [mapState, setMapState] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
    zoom: defaultZoom,
  });

  const [selectedPost, setSelectedPost] = useState(null);
  const dialog = useDialog();

  const mapUrl = "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png";
  const attribution = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const { data: posts = [], isLoading } = useNearbyPostsAPI(mapState);

  const uniquePosts = useMemo(() => {
    const seen = new Set();
    return posts.filter((post) => {
      const key = post.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [posts]);

  const handleMarkerClick = (post) => {
    setSelectedPost(post);
    dialog.setOpen(true);
  };

  // Update URL when mapState changes
  useEffect(() => {
    setSearchParams({
      lat: mapState.latitude.toFixed(5),
      lng: mapState.longitude.toFixed(5),
      zoom: mapState.zoom.toString(),
    });
  }, [mapState, setSearchParams]);

  return (
    <Box position="relative" minH="100vh" width="100%">
      <Toaster />

      <Box position="absolute" top="0" left="0" right="0" bottom="0" zIndex="0">
        <MapContainer
          center={[defaultLat, defaultLng]}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url={mapUrl} attribution={attribution} />
          <MapUpdater setMapState={setMapState} />

          {uniquePosts.map((post) => (
            <ClickablePostMarker key={post.id} post={post} onClick={handleMarkerClick} />
          ))}
        </MapContainer>
      </Box>

      {selectedPost && <PostDialog dialog={dialog} post={selectedPost} />}

      <Flex position="relative" zIndex="1" minH="100vh" px="0" pointerEvents="none">
        <Navbar />
        <Box flex="1" />
      </Flex>
    </Box>
  );
};

export default ExplorePage;

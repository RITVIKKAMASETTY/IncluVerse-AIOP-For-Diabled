import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';

function SignLanguageRecognition() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [handModel, setHandModel] = useState(null);
  const [aslModel, setAslModel] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [sentence, setSentence] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState(null);

  const [prevSign, setPrevSign] = useState('');
  const [sameSignCount, setSameSignCount] = useState(0);
  const STABLE_THRESHOLD = 3;

  const labelMap = 'ABCDEFGHIKLMNOPQRSTUVWX'.split(''); // 24 letters (excluding J, Z)

  useEffect(() => {
    const loadModel = async () => {
      try {
        const handposeModel = await handpose.load();
        const signModel = await tf.loadGraphModel('/asl_landmark_model1_tfjs/model.json');
        setHandModel(handposeModel);
        setAslModel(signModel);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load models. Please refresh the page.');
      }
    };
    loadModel();
  }, []);

  const detectHand = async () => {
    if (
      webcamRef.current?.video?.readyState === 4 &&
      handModel &&
      aslModel
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      video.width = videoWidth;
      video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await handModel.estimateHands(video);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      if (predictions.length === 0) return;

      predictions.forEach(async (predictionObj) => {
        const landmarks = predictionObj.landmarks;

        // Draw keypoints
        landmarks.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        });

        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17],
        ];
        connections.forEach(([start, end]) => {
          ctx.beginPath();
          ctx.moveTo(landmarks[start][0], landmarks[start][1]);
          ctx.lineTo(landmarks[end][0], landmarks[end][1]);
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        // Preprocess: Flatten 21 x 3 = 63
        const inputTensor = tf.tensor(landmarks.flat()).reshape([1, 63]);
        const predictionTensor = aslModel.predict(inputTensor);
        const predictionIndex = (await predictionTensor.argMax(1).data())[0];
        const currentSign = labelMap[predictionIndex];

        if (currentSign === prevSign) {
          setSameSignCount((prev) => prev + 1);
        } else {
          setPrevSign(currentSign);
          setSameSignCount(1);
        }

        if (sameSignCount >= STABLE_THRESHOLD && currentSign !== prediction) {
          setPrediction(currentSign);
          setSentence((prev) => prev + currentSign);
        }
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => detectHand(), 150);
    return () => clearInterval(interval);
  }, [handModel, aslModel, sameSignCount, prevSign]);

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearText = () => {
    setSentence('');
    setPrediction('');
    setPrevSign('');
    setSameSignCount(0);
  };

  if (isModelLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading model...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #ebf8ff, #ffffff, #f3e8ff)',
        fontFamily: 'HelveticaNeueW01-55Roma, Helvetica, Arial, sans-serif',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          sx={{ mb: 4, fontWeight: 'bold', color: '#1f2937' }}
        >
          Sign Language <span style={{ color: '#3b82f6' }}>Recognition</span> System
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                Camera Feed
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Webcam ref={webcamRef} style={{ width: '100%', height: 'auto' }} />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recognition Results
              </Typography>
              <Typography variant="h6" gutterBottom>
                Current Sign: {prediction}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Sentence: {sentence}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={speakText}
                  sx={{
                    background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 'medium',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    mr: 2,
                    '&:hover': {
                      background: 'linear-gradient(to right, #2563eb, #7e22ce)',
                    },
                  }}
                >
                  Speak
                </Button>
                <Button variant="contained" color="secondary" onClick={clearText}>
                  Clear
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default SignLanguageRecognition;

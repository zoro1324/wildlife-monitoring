"""
AI Detection Service for Wildlife Monitoring System.

Provides integration with YOLO models for animal detection.
"""

from django.conf import settings
import logging
import os

logger = logging.getLogger(__name__)


class AIDetectionService:
    """
    Service class for AI-based animal detection.
    
    Uses YOLO model to detect animals in images and classify threat levels.
    """
    
    # Animal class mapping (adjust based on your trained model)
    ANIMAL_CLASSES = {
        0: 'Bear',
        1: 'Bison',
        2: 'Boar',
        3: 'Elephant',
        4: 'Human',
        5: 'Leopard',
        6: 'Lion',
        7: 'Tiger',
    }
    
    def __init__(self):
        self.model = None
        self.model_path = settings.AI_SERVICE.get('MODEL_PATH')
        self.confidence_threshold = settings.AI_SERVICE.get('CONFIDENCE_THRESHOLD', 0.5)
        self.high_threat_animals = settings.AI_SERVICE.get('HIGH_THREAT_ANIMALS', [])
        self.medium_threat_animals = settings.AI_SERVICE.get('MEDIUM_THREAT_ANIMALS', [])
        
        self._load_model()
    
    def _load_model(self):
        """Load the YOLO model."""
        try:
            from ultralytics import YOLO
            
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                logger.info(f"AI model loaded from {self.model_path}")
            else:
                logger.error(f"Model file not found: {self.model_path}")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
                
        except ImportError:
            logger.error("ultralytics package not installed. Run: pip install ultralytics")
            raise
        except Exception as e:
            logger.error(f"Failed to load AI model: {e}")
            raise
    
    def detect(self, image_path):
        """
        Run detection on an image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of detection dictionaries with:
            - animal_type: str
            - confidence: float (0-1)
            - bounding_box: dict with x_min, y_min, x_max, y_max
            - threat_level: str ('low', 'medium', 'high')
        """
        if self.model is None:
            logger.error("AI model not loaded")
            return []
        
        try:
            # Run inference
            results = self.model(image_path, verbose=False)
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                
                if boxes is None:
                    continue
                
                for i in range(len(boxes)):
                    confidence = float(boxes.conf[i])
                    
                    # Skip low confidence detections
                    if confidence < self.confidence_threshold:
                        continue
                    
                    class_id = int(boxes.cls[i])
                    animal_type = self.ANIMAL_CLASSES.get(class_id, f'Unknown_{class_id}')
                    
                    # Get bounding box (normalized coordinates)
                    box = boxes.xyxyn[i].tolist()  # [x_min, y_min, x_max, y_max]
                    
                    # Determine threat level
                    threat_level = self._get_threat_level(animal_type)
                    
                    detection = {
                        'animal_type': animal_type,
                        'confidence': confidence,
                        'bounding_box': {
                            'x_min': box[0],
                            'y_min': box[1],
                            'x_max': box[2],
                            'y_max': box[3],
                        },
                        'threat_level': threat_level,
                    }
                    
                    detections.append(detection)
                    logger.debug(f"Detected: {animal_type} ({confidence:.2%}) - {threat_level} threat")
            
            logger.info(f"Detection complete: {len(detections)} animals found in {image_path}")
            return detections
            
        except Exception as e:
            logger.exception(f"Detection failed for {image_path}: {e}")
            return []
    
    def _get_threat_level(self, animal_type):
        """
        Determine threat level based on animal type.
        
        Args:
            animal_type: Name of the detected animal
            
        Returns:
            'low', 'medium', or 'high'
        """
        if animal_type in self.high_threat_animals:
            return 'high'
        elif animal_type in self.medium_threat_animals:
            return 'medium'
        else:
            return 'low'
    
    def get_model_info(self):
        """Get information about the loaded model."""
        if self.model is None:
            return {'status': 'not_loaded'}
        
        return {
            'status': 'loaded',
            'model_path': self.model_path,
            'confidence_threshold': self.confidence_threshold,
            'classes': self.ANIMAL_CLASSES,
            'high_threat_animals': self.high_threat_animals,
            'medium_threat_animals': self.medium_threat_animals,
        }


class MockAIDetectionService(AIDetectionService):
    """
    Mock AI service for testing without actual model.
    
    Returns random detections for development/testing purposes.
    """
    
    def __init__(self):
        self.confidence_threshold = 0.5
        self.high_threat_animals = ['Lion', 'Tiger', 'Leopard', 'Bear']
        self.medium_threat_animals = ['Elephant', 'Boar', 'Bison']
        logger.info("Using Mock AI Detection Service")
    
    def _load_model(self):
        """Mock implementation - no model needed."""
        pass
    
    def detect(self, image_path):
        """
        Return mock detections for testing.
        """
        import random
        
        animals = ['Bear', 'Bison', 'Boar', 'Elephant', 'Human', 'Leopard', 'Lion', 'Tiger']
        
        # Random number of detections (0-3)
        num_detections = random.randint(0, 3)
        
        detections = []
        for _ in range(num_detections):
            animal_type = random.choice(animals)
            confidence = random.uniform(0.6, 0.95)
            
            detection = {
                'animal_type': animal_type,
                'confidence': confidence,
                'bounding_box': {
                    'x_min': random.uniform(0.1, 0.4),
                    'y_min': random.uniform(0.1, 0.4),
                    'x_max': random.uniform(0.6, 0.9),
                    'y_max': random.uniform(0.6, 0.9),
                },
                'threat_level': self._get_threat_level(animal_type),
            }
            detections.append(detection)
        
        logger.info(f"Mock detection: {len(detections)} animals found")
        return detections

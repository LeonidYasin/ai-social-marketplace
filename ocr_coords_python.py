import pytesseract
from PIL import Image
import sys
import json

def get_text_coordinates(image_path, search_text="ПРОДОЛЖИТЬ КАК ГОСТЬ"):
    """Получает координаты текста на изображении"""
    try:
        # Открываем изображение
        image = Image.open(image_path)
        
        # Получаем данные с координатами
        data = pytesseract.image_to_data(image, lang='rus+eng', output_type=pytesseract.Output.DICT)
        
        print(f"🔍 Ищем текст: '{search_text}'")
        print(f"📊 Всего распознано слов: {len(data['text'])}")
        
        # Ищем нужный текст
        found_coords = []
        for i, text in enumerate(data['text']):
            if search_text.lower() in text.lower():
                x = data['left'][i]
                y = data['top'][i]
                width = data['width'][i]
                height = data['height'][i]
                conf = data['conf'][i]
                
                found_coords.append({
                    'text': text,
                    'x': x,
                    'y': y,
                    'width': width,
                    'height': height,
                    'confidence': conf,
                    'bbox': (x, y, x + width, y + height)
                })
                
                print(f"✅ Найдено: '{text}'")
                print(f"   Координаты: x={x}, y={y}, w={width}, h={height}")
                print(f"   Уверенность: {conf}%")
                print(f"   Bounding box: {x}, {y}, {x + width}, {y + height}")
        
        if not found_coords:
            print(f"❌ Текст '{search_text}' не найден")
            
            # Показываем все найденные слова для отладки
            print("\n📋 Все найденные слова:")
            for i, text in enumerate(data['text']):
                if text.strip():  # Показываем только непустые слова
                    x = data['left'][i]
                    y = data['top'][i]
                    conf = data['conf'][i]
                    print(f"  '{text}' - x:{x}, y:{y}, conf:{conf}%")
        
        return found_coords
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return []

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test_screenshots/step2_simple_01_initial.png"
    search_text = sys.argv[2] if len(sys.argv) > 2 else "ПРОДОЛЖИТЬ КАК ГОСТЬ"
    
    print(f"🚀 Анализируем изображение: {image_path}")
    coords = get_text_coordinates(image_path, search_text) 
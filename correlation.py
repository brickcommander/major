import cv2
import os

import logging
import csv

import numpy as np
import matplotlib.pyplot as plt

path, dirs, files = next(os.walk("public/images/"))
file_count = len(files)

logging.basicConfig(level=logging.NOTSET)

# all_images = []
# titles = []

max = file_count
min = 0
pic_num = min

save_to_final = 'E:/Major/m2/public/csv/distances_final.csv'
save_to = 'E:/Major/m2/public/csv/distances2.csv'
org = 'E:/Major/m2/public/csv/distances.csv'

# for a in range(min, max):
#     image = cv2.imread(
#         "E:/Major/m2/public/images/result" + str(a) + ".png",
#         cv2.IMREAD_GRAYSCALE)
#     f = "frame_" + str(a)
#     titles.append(f)
#     #print(f)
#     all_images.append(image)

#     if pic_num < max:
#         pic_num = pic_num + 1

logging.info("finish reading")

correlations = []

for b in range(min, max):
    original = cv2.imread(
        "E:/Major/m2/public/attacked_images/result" + str(b) + ".png",
        cv2.IMREAD_GRAYSCALE)
    image_to_compare = cv2.imread(
        "E:/Major/m2/public/images/result" + str(b) + ".png",
        cv2.IMREAD_GRAYSCALE)
    
    title = "frame_" + str(b)

    orb = cv2.SIFT_create()
    kp_1, desc_1 = orb.detectAndCompute(original, None)
    kp_2, desc_2 = orb.detectAndCompute(image_to_compare, None)

    bf = cv2.BFMatcher(cv2.NORM_L1, crossCheck=False)
    # matches = bf.match(desc_1, desc_2)

    if len(kp_1) <= len(kp_2):
        number_keypoints_original = len(kp_1)
    else:
        number_keypoints_original = len(kp_2)
    
    # number_keypoints_original = min(len(kp_1), len(kp_2))

    # cv2.imshow("correspondences", original)
    # cv2.waitKey()
    # cv2.destroyAllWindows()

    # orb = cv2.SIFT_create()
    # kp_1, desc_1 = orb.detectAndCompute(original, None)

    # for image_to_compare, title in zip(all_images, titles):

    #     # 2) Check for similarities between the 2 images

    #     kp_2, desc_2 = orb.detectAndCompute(image_to_compare, None)

    #     bf = cv2.BFMatcher(cv2.NORM_L1, crossCheck=False)

    try:

        matches = bf.match(desc_1, desc_2)
        good_points = []
        for m in matches:
            if m.distance < 0.99:
                good_points.append(m)

        #print("len of good points", len(good_points))

        number_keypoints = 0
        if len(kp_1) <= len(kp_2):
            number_keypoints = len(kp_1)
        else:
            number_keypoints = len(kp_2)

        percentage_similarity = (len(good_points) / number_keypoints_original) * 100
        print("now frame " + str(b) + " VS " + title + " Similarity: " + str(int(percentage_similarity)) + "%\n")
        
        result = cv2.drawMatches(original, kp_1, image_to_compare, kp_2, good_points, None)
        # cv2.imshow("result", cv2.resize(result, None, fx=5.8, fy=6.8))
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()

        correlations.append(percentage_similarity/100.0)
    except:
        percentage_similarity = 0
        print("now frame " + str(b) + " VS " + title + " Similarity: " + str(int(percentage_similarity)) + "%\n")


with open(org, 'r') as f:
    with open(save_to, 'w') as f1:
        next(f) # skip header line
        for line in f:
            f1.write(line)

print(correlations)
print(len(correlations))

x = np.arange(1, len(correlations)+1)
y = np.array(correlations)

plt.title("Line graph")
plt.ylabel("Probability of Attack")
plt.xlabel("Time")
plt.plot(x, y, color ="green")
plt.show()

with open(save_to, 'r') as csvinput:
    with open(save_to_final, 'w') as csvoutput:
        writer = csv.writer(csvoutput)
        i = 0
        for row in csv.reader(csvinput):

            if i < len(correlations):
                writer.writerow(row + [correlations[i]])
                i = i + 1

exit()
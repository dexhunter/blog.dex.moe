import re
from datetime import datetime

post_name = input('Please input the post name (file)\n')
post_name = re.sub(r'\s+', '-', post_name)
today_date = datetime.now().strftime("%Y-%m-%d")
post_name = today_date+"-"+post_name+".md"
print(post_name)
title = input('Please input title\n')
categories = input('Please input categories. Example: cat1 cat2\n')
tags = input('Please input tags. Example: tag1 tag2\n')

now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
content = """---
layout: post
title: "{}"
date: {}
categories: {}
tags: {}
---
""".format(title, now_datetime, categories, tags)

print(content)


with open('_posts/'+post_name, 'w') as f:
    f.write(content)

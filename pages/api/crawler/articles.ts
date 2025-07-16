import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import {
  PaginatedResponse,
  Article,
  ArticlesData,
  ArticlesQueryParams,
} from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    PaginatedResponse<Article> | { error: string; details?: string }
  >,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    page = '1',
    limit = '20',
    source,
    keyword,
  } = req.query as Partial<ArticlesQueryParams> & {
    [key: string]: string | string[];
  };

  try {
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');

    let articles: Article[] = [];
    try {
      const articlesData = await fs.readFile(articlesPath, 'utf8');
      const parsed = JSON.parse(articlesData) as ArticlesData;
      articles = parsed.articles || [];
    } catch (error) {
      return res.status(200).json({
        articles: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    // 필터링
    if (source && typeof source === 'string') {
      articles = articles.filter((article) =>
        article.source.toLowerCase().includes(source.toLowerCase()),
      );
    }

    if (keyword && typeof keyword === 'string') {
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(keyword.toLowerCase()) ||
          article.description.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    // 페이지네이션
    const pageNumber = parseInt(Array.isArray(page) ? page[0] : page);
    const limitNumber = parseInt(Array.isArray(limit) ? limit[0] : limit);

    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    const response: PaginatedResponse<Article> = {
      articles: paginatedArticles,
      totalCount: articles.length,
      currentPage: pageNumber,
      totalPages: Math.ceil(articles.length / limitNumber),
      hasNextPage: endIndex < articles.length,
      hasPrevPage: startIndex > 0,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('문서 목록 조회 실패:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: '문서 목록 조회 실패',
      details: errorMessage,
    });
  }
}
